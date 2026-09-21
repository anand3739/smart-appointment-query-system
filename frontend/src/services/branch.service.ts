import api from './api';
import { ApiResponse, Branch, WorkingHour, Holiday } from '../types';

export const branchService = {
  async getBranches(includeInactive = false): Promise<Branch[]> {
    const res = await api.get<ApiResponse<Branch[]>>(`/branches?includeInactive=${includeInactive}`);
    return res.data.data!;
  },

  async getBranch(id: string): Promise<Branch> {
    const res = await api.get<ApiResponse<Branch>>(`/branches/${id}`);
    return res.data.data!;
  },

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const res = await api.post<ApiResponse<Branch>>('/branches', data);
    return res.data.data!;
  },

  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const res = await api.put<ApiResponse<Branch>>(`/branches/${id}`, data);
    return res.data.data!;
  },

  async deleteBranch(id: string): Promise<void> {
    await api.delete(`/branches/${id}`);
  },

  async setWorkingHours(branchId: string, hours: WorkingHour[]): Promise<WorkingHour[]> {
    const res = await api.post<ApiResponse<WorkingHour[]>>(`/branches/${branchId}/working-hours`, { hours });
    return res.data.data!;
  },

  async addHoliday(branchId: string, data: { date: string; reason: string }): Promise<Holiday> {
    const res = await api.post<ApiResponse<Holiday>>(`/branches/${branchId}/holidays`, data);
    return res.data.data!;
  }
};
