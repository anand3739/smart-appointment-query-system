import api from './api';
import { ApiResponse, Notification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const res = await api.get<ApiResponse<Notification[]>>('/notifications');
    return res.data.data!;
  },

  async markAsRead(id: string): Promise<Notification> {
    const res = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return res.data.data!;
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
  }
};
