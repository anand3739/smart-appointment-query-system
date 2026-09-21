import api from './api';
import { ApiResponse, WaitlistEntry } from '../types';

export const waitlistService = {
  async joinWaitlist(data: { branchId: string; serviceId: string; preferredDate: string }): Promise<WaitlistEntry> {
    const res = await api.post<ApiResponse<WaitlistEntry>>('/waitlist', data);
    return res.data.data!;
  },

  async getMyWaitlist(): Promise<WaitlistEntry[]> {
    const res = await api.get<ApiResponse<WaitlistEntry[]>>('/waitlist');
    return res.data.data!;
  },

  async acceptOffer(id: string): Promise<{ message: string; appointmentId: string }> {
    const res = await api.post<ApiResponse<{ message: string; appointmentId: string }>>(`/waitlist/${id}/accept`);
    return res.data.data!;
  },

  async leaveWaitlist(id: string): Promise<void> {
    await api.delete(`/waitlist/${id}`);
  }
};
