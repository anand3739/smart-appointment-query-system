import {
  appointmentRepo,
  serviceRepo,
  branchRepo,
  resourceRepo,
  availabilityRepo,
  notificationRepo,
  waitlistRepo,
} from '../repositories';
import { isDateOverlapping } from '../utils/time';
import { emitAppointmentStatusChanged, emitNotification } from '../realtime/events';

const slotMutexes = new Map<string, Promise<void>>();

async function acquireSlotLock(key: string): Promise<() => void> {
  while (slotMutexes.has(key)) {
    await slotMutexes.get(key);
  }

  let release: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    release = resolve;
  });

  slotMutexes.set(key, lockPromise);

  return () => {
    slotMutexes.delete(key);
    release!();
  };
}

export class BookingService {
  async bookAppointment(data: {
    customerId: string;
    branchId: string;
    serviceId: string;
    startTime: string;
    notes?: string;
    idempotencyKey?: string;
    reservationId?: string;
  }) {
    const branch = await branchRepo.findById(data.branchId);
    if (!branch || !branch.isActive) {
      const error: any = new Error('Branch not found or inactive');
      error.statusCode = 404;
      error.code = 'BRANCH_NOT_FOUND';
      throw error;
    }

    const service = await serviceRepo.findById(data.serviceId);
    if (!service || !service.isActive) {
      const error: any = new Error('Service not found or inactive');
      error.statusCode = 404;
      error.code = 'SERVICE_NOT_FOUND';
      throw error;
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    let dateStr = '';
    let slotTimeStr = '';
    if (data.startTime.includes('T')) {
      const parts = data.startTime.split('T');
      dateStr = parts[0];
      slotTimeStr = parts[1].slice(0, 5);
    } else {
      dateStr = startTime.toISOString().split('T')[0];
      const hours = String(startTime.getHours()).padStart(2, '0');
      const minutes = String(startTime.getMinutes()).padStart(2, '0');
      slotTimeStr = `${hours}:${minutes}`;
    }

    const lockKey = `lock:slot:${data.branchId}:${data.serviceId}:${dateStr}:${slotTimeStr}`;
    const releaseLock = await acquireSlotLock(lockKey);

    try {
      // 1. Transactional Availability Re-check
      const availableSlots = await availabilityRepo.getAvailableSlots(
        data.branchId,
        data.serviceId,
        dateStr
      );

      // If customer has an active reservation hold, allow booking even if capacity is 1
      let hasValidHold = false;
      if (data.reservationId) {
        hasValidHold = true;
      }

      if (!hasValidHold && !availableSlots.includes(slotTimeStr)) {
        const error: any = new Error('The selected appointment slot is no longer available.');
        error.statusCode = 409;
        error.code = 'SLOT_UNAVAILABLE';
        throw error;
      }

      // 2. Resource Validation & Allocation
      let assignedResourceId: string | undefined;
      if (service.requiredResourceType) {
        const availableResources = await resourceRepo.findAvailable(
          data.branchId,
          service.requiredResourceType,
          startTime,
          endTime
        );
        if (availableResources.length === 0) {
          const error: any = new Error('No physical resource available for this appointment slot.');
          error.statusCode = 409;
          error.code = 'RESOURCE_UNAVAILABLE';
          throw error;
        }
        assignedResourceId = availableResources[0].id;
      }

      // 3. Create Appointment
      const appointment = await appointmentRepo.create({
        customerId: data.customerId,
        branchId: data.branchId,
        serviceId: data.serviceId,
        startTime,
        endTime,
        notes: data.notes,
        idempotencyKey: data.idempotencyKey,
        assignedResourceId,
      });

      // 4. Release temporary hold if used
      if (data.reservationId) {
        await availabilityRepo.releaseReservation(data.reservationId);
      }

      // 5. In-App Notification & Real-time alert
      const notif = await notificationRepo.create({
        userId: data.customerId,
        type: 'BOOKING_CONFIRMED',
        title: 'Appointment Confirmed',
        message: `Your booking #${appointment.appointmentNumber} for ${service.name} at ${branch.name} is confirmed for ${startTime.toLocaleString()}.`,
        data: { appointmentId: appointment.id, appointmentNumber: appointment.appointmentNumber },
      });

      emitNotification(data.customerId, notif);
      emitAppointmentStatusChanged(data.customerId, appointment);

      return appointment;
    } finally {
      releaseLock();
    }
  }

  async cancelAppointment(appointmentId: string, userId: string, reason?: string) {
    const appointment = await appointmentRepo.findById(appointmentId);
    if (!appointment) {
      const error: any = new Error('Appointment not found');
      error.statusCode = 404;
      error.code = 'APPOINTMENT_NOT_FOUND';
      throw error;
    }

    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      const error: any = new Error(`Cannot cancel appointment with status ${appointment.status}`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const updated = await appointmentRepo.updateStatus(
      appointmentId,
      'CANCELLED',
      reason || 'Cancelled by user',
      userId
    );

    // Create Notification
    const notif = await notificationRepo.create({
      userId: appointment.customerId,
      type: 'BOOKING_CANCELLED',
      title: 'Appointment Cancelled',
      message: `Your appointment #${appointment.appointmentNumber} has been cancelled.`,
      data: { appointmentId, reason },
    });
    emitNotification(appointment.customerId, notif);
    emitAppointmentStatusChanged(appointment.customerId, updated);

    // Trigger Waiting List auto-allocation
    await this.triggerWaitlistProcessing(
      appointment.branchId,
      appointment.serviceId,
      new Date(appointment.startTime)
    );

    return updated;
  }

  async rescheduleAppointment(
    appointmentId: string,
    userId: string,
    newStartTimeStr: string,
    reason?: string
  ) {
    const appointment = await appointmentRepo.findById(appointmentId);
    if (!appointment) {
      const error: any = new Error('Appointment not found');
      error.statusCode = 404;
      error.code = 'APPOINTMENT_NOT_FOUND';
      throw error;
    }

    if (appointment.status !== 'CONFIRMED' && appointment.status !== 'PENDING') {
      const error: any = new Error(`Cannot reschedule appointment with status ${appointment.status}`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const service = appointment.service;
    const newStartTime = new Date(newStartTimeStr);
    const newEndTime = new Date(newStartTime.getTime() + service.durationMinutes * 60000);

    let newDateStr = '';
    let slotTimeStr = '';
    if (newStartTimeStr.includes('T')) {
      const parts = newStartTimeStr.split('T');
      newDateStr = parts[0];
      slotTimeStr = parts[1].slice(0, 5);
    } else {
      newDateStr = newStartTime.toISOString().split('T')[0];
      const hours = String(newStartTime.getHours()).padStart(2, '0');
      const minutes = String(newStartTime.getMinutes()).padStart(2, '0');
      slotTimeStr = `${hours}:${minutes}`;
    }

    // Verify availability for new slot
    const availableSlots = await availabilityRepo.getAvailableSlots(
      appointment.branchId,
      appointment.serviceId,
      newDateStr
    );

    if (!availableSlots.includes(slotTimeStr)) {
      const error: any = new Error('The requested new slot is not available.');
      error.statusCode = 409;
      error.code = 'SLOT_UNAVAILABLE';
      throw error;
    }

    // Verify physical resource for new slot
    let newResourceId: string | undefined;
    if (service.requiredResourceType) {
      const availableResources = await resourceRepo.findAvailable(
        appointment.branchId,
        service.requiredResourceType,
        newStartTime,
        newEndTime
      );
      if (availableResources.length === 0) {
        const error: any = new Error('No available resources for the new appointment time.');
        error.statusCode = 409;
        error.code = 'RESOURCE_UNAVAILABLE';
        throw error;
      }
      newResourceId = availableResources[0].id;
    }

    const oldStartTime = new Date(appointment.startTime);
    const updated = await appointmentRepo.reschedule(
      appointmentId,
      newStartTime,
      newEndTime,
      newResourceId
    );

    // Notify customer
    const notif = await notificationRepo.create({
      userId: appointment.customerId,
      type: 'BOOKING_RESCHEDULED',
      title: 'Appointment Rescheduled',
      message: `Your appointment #${appointment.appointmentNumber} was rescheduled to ${newStartTime.toLocaleString()}.`,
      data: { appointmentId, newStartTime: newStartTime.toISOString() },
    });
    emitNotification(appointment.customerId, notif);
    emitAppointmentStatusChanged(appointment.customerId, updated);

    // Old slot is now freed up; trigger waitlist for the old slot date!
    await this.triggerWaitlistProcessing(
      appointment.branchId,
      appointment.serviceId,
      oldStartTime
    );

    return updated;
  }

  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: string,
    reason?: string,
    changedById?: string
  ) {
    const appointment = await appointmentRepo.findById(appointmentId);
    if (!appointment) {
      const error: any = new Error('Appointment not found');
      error.statusCode = 404;
      error.code = 'APPOINTMENT_NOT_FOUND';
      throw error;
    }

    const updated = await appointmentRepo.updateStatus(appointmentId, newStatus, reason, changedById);

    // If marked NO_SHOW, free capacity and trigger waitlist
    if (newStatus === 'NO_SHOW') {
      await this.triggerWaitlistProcessing(
        appointment.branchId,
        appointment.serviceId,
        new Date(appointment.startTime)
      );
    }

    emitAppointmentStatusChanged(appointment.customerId, updated);
    return updated;
  }

  async triggerWaitlistProcessing(branchId: string, serviceId: string, date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    const eligible = await waitlistRepo.findEligible(branchId, serviceId, dateStr);

    if (eligible && eligible.length > 0) {
      const candidate = eligible[0];
      const expiry = new Date(Date.now() + 30 * 60000); // 30 mins to accept

      await waitlistRepo.updateStatus(candidate.id, 'OFFERED', {
        offeredSlot: date,
        expiresAt: expiry,
      });

      const notif = await notificationRepo.create({
        userId: candidate.customerId,
        type: 'WAITLIST_AVAILABLE',
        title: 'Appointment Slot Available!',
        message: `An appointment slot opened on ${dateStr} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please accept within 30 minutes to claim your booking.`,
        data: { waitlistId: candidate.id, slotTime: date.toISOString() },
      });
      emitNotification(candidate.customerId, notif);
    }
  }

  async getAppointments(filter: { customerId?: string; branchId?: string; date?: string; status?: string }) {
    return appointmentRepo.findMany(filter);
  }

  async getAppointmentById(id: string) {
    const appointment = await appointmentRepo.findById(id);
    if (!appointment) {
      const error: any = new Error('Appointment not found');
      error.statusCode = 404;
      error.code = 'APPOINTMENT_NOT_FOUND';
      throw error;
    }
    return appointment;
  }
}

export const bookingService = new BookingService();
