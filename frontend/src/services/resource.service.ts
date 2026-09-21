import api from './api';
import { ApiResponse, Resource } from '../types';

export const resourceService = {
  async getResources(branchId?: string): Promise<Resource[]> {
    const url = branchId ? `/resources?branchId=${branchId}` : '/resources';
    const res = await api.get<ApiResponse<Resource[]>>(url);
    return res.data.data!;
  },

  async createResource(data: Partial<Resource>): Promise<Resource> {
    const res = await api.post<ApiResponse<Resource>>('/resources', data);
    return res.data.data!;
  },

  async updateResource(id: string, data: Partial<Resource>): Promise<Resource> {
    const res = await api.put<ApiResponse<Resource>>(`/resources/${id}`, data);
    return res.data.data!;
  },

  async deleteResource(id: string): Promise<void> {
    await api.delete(`/resources/${id}`);
  }
};
