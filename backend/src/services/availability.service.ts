import { availabilityRepo, serviceRepo, branchRepo } from '../repositories';
import { env } from '../config/env';

export class AvailabilityService {
  async getAvailability(branchId: string, serviceId: string, date: string) {
    const branch = await branchRepo.findById(branchId);
    if (!branch) {
      const error: any = new Error('Branch not found');
      error.statusCode = 404;
      error.code = 'BRANCH_NOT_FOUND';
      throw error;
    }

    const service = await serviceRepo.findById(serviceId);
    if (!service) {
      const error: any = new Error('Service not found');
      error.statusCode = 404;
      error.code = 'SERVICE_NOT_FOUND';
      throw error;
    }

    const availableSlots = await availabilityRepo.getAvailableSlots(branchId, serviceId, date);

    return {
      date,
      serviceId,
      branchId,
      slotDurationMinutes: service.durationMinutes,
      availableSlots,
    };
  }

  async reserveTemporarySlot(branchId: string, serviceId: string, slotStartTimeStr: string, userId: string) {
    const service = await serviceRepo.findById(serviceId);
    if (!service) {
      const error: any = new Error('Service not found');
      error.statusCode = 404;
      error.code = 'SERVICE_NOT_FOUND';
      throw error;
    }

    const slotStartTime = new Date(slotStartTimeStr);
    const slotEndTime = new Date(slotStartTime.getTime() + service.durationMinutes * 60000);
    const dateStr = slotStartTimeStr.includes('T')
      ? slotStartTimeStr.split('T')[0]
      : slotStartTime.toISOString().split('T')[0];

    const slotTimeStr = slotStartTimeStr.includes('T')
      ? slotStartTimeStr.split('T')[1].slice(0, 5)
      : slotStartTime.toISOString().split('T')[1].slice(0, 5);

    // Re-verify availability
    const availableSlots = await availabilityRepo.getAvailableSlots(branchId, serviceId, dateStr);

    if (!availableSlots.includes(slotTimeStr)) {
      const error: any = new Error('Selected slot is no longer available');
      error.statusCode = 409;
      error.code = 'SLOT_UNAVAILABLE';
      throw error;
    }

    const reservation = await availabilityRepo.reserveSlot(
      branchId,
      serviceId,
      slotStartTime,
      slotEndTime,
      userId,
      env.RESERVATION_HOLD_MINUTES
    );

    return {
      reservationId: reservation.id,
      expiresAt: reservation.expiresAt.toISOString(),
      slotStartTime: reservation.slotStartTime.toISOString(),
      slotEndTime: reservation.slotEndTime.toISOString(),
    };
  }

  async releaseReservation(reservationId: string) {
    await availabilityRepo.releaseReservation(reservationId);
    return { message: 'Reservation released successfully' };
  }
}

export const availabilityService = new AvailabilityService();
