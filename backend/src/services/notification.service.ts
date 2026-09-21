import { notificationRepo } from '../repositories';

export class NotificationService {
  async getUserNotifications(userId: string) {
    return notificationRepo.findByUser(userId);
  }

  async markAsRead(id: string) {
    const updated = await notificationRepo.markAsRead(id);
    if (!updated) {
      const error: any = new Error('Notification not found');
      error.statusCode = 404;
      error.code = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }
    return updated;
  }

  async markAllAsRead(userId: string) {
    await notificationRepo.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }
}

export const notificationService = new NotificationService();
