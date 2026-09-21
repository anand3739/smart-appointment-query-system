import api from './api';
import { ApiResponse } from '../types';

export interface AnalyticsData {
  totalBookings: number;
  completedAppointments: number;
  cancellations: number;
  noShows: number;
  averageWaitTimeMinutes: number;
  averageServiceDurationMinutes: number;
  popularServices: Array<{ serviceName: string; count: number }>;
  branchPerformance: Array<{ branchName: string; count: number; completedCount: number }>;
  resourceUtilization: Array<{ resourceName: string; usageHours: number }>;
  dailyVolume: Array<{ date: string; bookings: number; walkins: number }>;
}

export const analyticsService = {
  async getDashboardMetrics(params?: { branchId?: string; startDate?: string; endDate?: string }): Promise<AnalyticsData> {
    const res = await api.get<ApiResponse<AnalyticsData>>('/analytics/dashboard', { params });
    return res.data.data!;
  }
};
