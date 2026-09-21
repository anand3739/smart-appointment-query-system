import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/apiResponse';

export class AnalyticsController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.query.branchId as string;
      const metrics = await analyticsService.getDashboardAnalytics(branchId);
      return sendSuccess(res, metrics);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
