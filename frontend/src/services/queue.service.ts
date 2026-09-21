import api from './api';
import { ApiResponse, QueueEntry, PriorityLevel } from '../types';

export interface MyQueuePosition {
  entry: QueueEntry;
  position: number;
  peopleAhead: number;
  currentServingNumber: string | null;
}

export const queueService = {
  async getLiveQueue(branchId: string): Promise<QueueEntry[]> {
    const res = await api.get<ApiResponse<QueueEntry[]>>('/queue/live', { params: { branchId } });
    return res.data.data!;
  },

  async getMyPosition(): Promise<MyQueuePosition | null> {
    const res = await api.get<ApiResponse<MyQueuePosition | null>>('/queue/my-position');
    return res.data.data ?? null;
  },

  async addWalkin(data: {
    branchId: string;
    serviceId: string;
    customerName: string;
    customerPhone?: string;
    priority: PriorityLevel;
    notes?: string;
  }): Promise<QueueEntry> {
    const res = await api.post<ApiResponse<QueueEntry>>('/queue/walkin', data);
    return res.data.data!;
  },

  async checkin(appointmentId: string): Promise<QueueEntry> {
    const res = await api.post<ApiResponse<QueueEntry>>('/queue/checkin', { appointmentId });
    return res.data.data!;
  },

  async callNext(branchId: string, resourceId?: string): Promise<QueueEntry | null> {
    const res = await api.post<ApiResponse<QueueEntry | null>>('/queue/call-next', { branchId, resourceId });
    return res.data.data ?? null;
  },

  async startService(queueEntryId: string, resourceId?: string): Promise<QueueEntry> {
    const res = await api.post<ApiResponse<QueueEntry>>(`/queue/${queueEntryId}/start-service`, { resourceId });
    return res.data.data!;
  },

  async completeService(queueEntryId: string): Promise<QueueEntry> {
    const res = await api.post<ApiResponse<QueueEntry>>(`/queue/${queueEntryId}/complete`);
    return res.data.data!;
  },

  async skip(queueEntryId: string): Promise<QueueEntry> {
    const res = await api.post<ApiResponse<QueueEntry>>(`/queue/${queueEntryId}/skip`);
    return res.data.data!;
  },

  async remove(queueEntryId: string): Promise<void> {
    await api.delete(`/queue/${queueEntryId}`);
  }
};
