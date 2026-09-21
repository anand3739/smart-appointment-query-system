import { waitlistRepo, branchRepo, serviceRepo } from '../repositories';
import { bookingService } from './booking.service';

export class WaitlistService {
  async joinWaitlist(data: { customerId: string; branchId: string; serviceId: string; preferredDate: string }) {
    const branch = await branchRepo.findById(data.branchId);
    if (!branch) {
      const error: any = new Error('Branch not found');
      error.statusCode = 404;
      error.code = 'BRANCH_NOT_FOUND';
      throw error;
    }

    const service = await serviceRepo.findById(data.serviceId);
    if (!service) {
      const error: any = new Error('Service not found');
      error.statusCode = 404;
      error.code = 'SERVICE_NOT_FOUND';
      throw error;
    }

    const preferredDate = new Date(data.preferredDate);
    return waitlistRepo.create({
      customerId: data.customerId,
      branchId: data.branchId,
      serviceId: data.serviceId,
      preferredDate,
    });
  }

  async getMyWaitlist(userId: string) {
    return waitlistRepo.findByUser(userId);
  }

  async acceptOffer(waitlistId: string, userId: string) {
    const entries = await waitlistRepo.findByUser(userId);
    const entry = entries.find((e) => e.id === waitlistId);

    if (!entry) {
      const error: any = new Error('Waitlist entry not found');
      error.statusCode = 404;
      error.code = 'WAITLIST_NOT_FOUND';
      throw error;
    }

    if (entry.status !== 'OFFERED' || !entry.offeredSlot) {
      const error: any = new Error('No active slot offer for this entry');
      error.statusCode = 400;
      error.code = 'NO_OFFER_AVAILABLE';
      throw error;
    }

    if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
      await waitlistRepo.updateStatus(waitlistId, 'EXPIRED');
      const error: any = new Error('Slot offer has expired');
      error.statusCode = 410;
      error.code = 'OFFER_EXPIRED';
      throw error;
    }

    // Convert into confirmed appointment
    const appointment = await bookingService.bookAppointment({
      customerId: userId,
      branchId: entry.branchId,
      serviceId: entry.serviceId,
      startTime: new Date(entry.offeredSlot).toISOString(),
      notes: 'Booked via Waitlist auto-allocation',
    });

    await waitlistRepo.updateStatus(waitlistId, 'ACCEPTED');

    return {
      message: 'Slot offer accepted successfully',
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
    };
  }

  async leaveWaitlist(waitlistId: string) {
    await waitlistRepo.delete(waitlistId);
    return { message: 'Removed from waiting list' };
  }
}

export const waitlistService = new WaitlistService();
