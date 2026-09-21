import { Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middlewares/auth.middleware';

export class NotificationController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user!.userId);
      return sendSuccess(res, notifications);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markAsRead(req.params.id as string);
      return sendSuccess(res, notification);
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllAsRead(req.user!.userId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
