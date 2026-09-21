import { analyticsRepo } from '../repositories';

export class AnalyticsService {
  async getDashboardAnalytics(branchId?: string) {
    return analyticsRepo.getMetrics(branchId);
  }
}

export const analyticsService = new AnalyticsService();
