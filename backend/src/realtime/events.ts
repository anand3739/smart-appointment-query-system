import { getIO } from './socket.server';

export function emitQueueUpdated(branchId: string, data?: any) {
  try {
    const io = getIO();
    io.to(`branch:${branchId}`).emit('queue:updated', data);
  } catch (err) {
    // Socket not ready, ignore
  }
}

export function emitCustomerCalled(branchId: string, queueEntry: any) {
  try {
    const io = getIO();
    io.to(`branch:${branchId}`).emit('customer:called', queueEntry);
    if (queueEntry.customerId) {
      io.to(`user:${queueEntry.customerId}`).emit('customer:called', queueEntry);
    }
  } catch (err) {
    // Socket not ready, ignore
  }
}

export function emitNotification(userId: string, notification: any) {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('notification:new', notification);
  } catch (err) {
    // Socket not ready, ignore
  }
}

export function emitAppointmentStatusChanged(userId: string, appointment: any) {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('appointment:status_changed', appointment);
    if (appointment.branchId) {
      io.to(`branch:${appointment.branchId}`).emit('appointment:status_changed', appointment);
    }
  } catch (err) {
    // Socket not ready, ignore
  }
}
