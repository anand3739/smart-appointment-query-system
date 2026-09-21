import api from './api';
import { ApiResponse, Service } from '../types';

export const serviceService = {
  async getServices(includeInactive = false): Promise<Service[]> {
    const res = await api.get<ApiResponse<Service[]>>(`/services?includeInactive=${includeInactive}`);
    return res.data.data!;
  },

  async getService(id: string): Promise<Service> {
    const res = await api.get<ApiResponse<Service>>(`/services/${id}`);
    return res.data.data!;
  },

  async createService(data: Partial<Service>): Promise<Service> {
    const res = await api.post<ApiResponse<Service>>('/services', data);
    return res.data.data!;
  },

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const res = await api.put<ApiResponse<Service>>(`/services/${id}`, data);
    return res.data.data!;
  },

  async deleteService(id: string): Promise<void> {
    await api.delete(`/services/${id}`);
  }
};
