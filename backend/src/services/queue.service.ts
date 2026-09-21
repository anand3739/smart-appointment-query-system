import { queueRepo, branchRepo, serviceRepo, resourceRepo, notificationRepo } from '../repositories';
import { emitQueueUpdated, emitCustomerCalled, emitNotification } from '../realtime/events';

export class QueueService {
  async addWalkin(data: {
    branchId: string;
    serviceId: string;
    customerName: string;
    customerPhone?: string;
    priority: 'NORMAL' | 'PRIORITY' | 'EMERGENCY';
    notes?: string;
  }) {
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

    const entry = await queueRepo.createWalkin(data);
    emitQueueUpdated(data.branchId, { action: 'WALKIN_ADDED', entry });
    return entry;
  }

  async checkinAppointment(appointmentId: string) {
    const entry = await queueRepo.checkinAppointment(appointmentId);
    emitQueueUpdated(entry.branchId, { action: 'APPOINTMENT_CHECKED_IN', entry });

    if (entry.customerId) {
      const notif = await notificationRepo.create({
        userId: entry.customerId,
        type: 'QUEUE_POSITION_CHANGED',
        title: 'Checked into Queue',
        message: `Your ticket number is ${entry.queueNumber}. Please wait for your number to be called.`,
        data: { queueNumber: entry.queueNumber, queueId: entry.id },
      });
      emitNotification(entry.customerId, notif);
    }

    return entry;
  }

  async getLiveQueue(branchId: string) {
    return queueRepo.getLiveQueue(branchId);
  }

  async getMyPosition(userId: string) {
    return queueRepo.getMyPosition(userId);
  }

  async callNext(branchId: string, resourceId?: string) {
    const entry = await queueRepo.callNext(branchId, resourceId);
    if (!entry) {
      return null;
    }

    emitCustomerCalled(branchId, entry);
    emitQueueUpdated(branchId, { action: 'CUSTOMER_CALLED', entry });

    if (entry.customerId) {
      const notif = await notificationRepo.create({
        userId: entry.customerId,
        type: 'QUEUE_CALLED',
        title: 'Now Calling You!',
        message: `Ticket ${entry.queueNumber}: Please proceed to the counter/desk.`,
        data: { queueNumber: entry.queueNumber },
      });
      emitNotification(entry.customerId, notif);
    }

    return entry;
  }

  async startService(queueEntryId: string, resourceId?: string) {
    const entry = await queueRepo.startService(queueEntryId, resourceId);
    if (!entry) {
      const error: any = new Error('Queue entry not found');
      error.statusCode = 404;
      error.code = 'QUEUE_ENTRY_NOT_FOUND';
      throw error;
    }

    emitQueueUpdated(entry.branchId, { action: 'SERVICE_STARTED', entry });
    return entry;
  }

  async completeService(queueEntryId: string) {
    const entry = await queueRepo.completeService(queueEntryId);
    if (!entry) {
      const error: any = new Error('Queue entry not found');
      error.statusCode = 404;
      error.code = 'QUEUE_ENTRY_NOT_FOUND';
      throw error;
    }

    emitQueueUpdated(entry.branchId, { action: 'SERVICE_COMPLETED', entry });

    if (entry.customerId) {
      const notif = await notificationRepo.create({
        userId: entry.customerId,
        type: 'SERVICE_COMPLETED',
        title: 'Service Completed',
        message: `Your service session for ticket ${entry.queueNumber} has been completed. Thank you!`,
        data: { queueNumber: entry.queueNumber },
      });
      emitNotification(entry.customerId, notif);
    }

    return entry;
  }

  async skipCustomer(queueEntryId: string) {
    const entry = await queueRepo.skip(queueEntryId);
    if (!entry) {
      const error: any = new Error('Queue entry not found');
      error.statusCode = 404;
      error.code = 'QUEUE_ENTRY_NOT_FOUND';
      throw error;
    }

    emitQueueUpdated(entry.branchId, { action: 'CUSTOMER_SKIPPED', entry });
    return entry;
  }

  async removeQueueEntry(queueEntryId: string) {
    const entry = await queueRepo.findById(queueEntryId);
    if (entry) {
      await queueRepo.delete(queueEntryId);
      emitQueueUpdated(entry.branchId, { action: 'ENTRY_REMOVED', queueEntryId });
    }
    return { message: 'Queue entry removed successfully' };
  }
}

export const queueService = new QueueService();
