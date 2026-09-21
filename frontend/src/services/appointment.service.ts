import api from './api';
import { ApiResponse, Appointment } from '../types';

export interface AvailabilityResponse {
  date: string;
  serviceId: string;
  branchId: string;
  slotDurationMinutes: number;
  availableSlots: string[];
}

export interface TemporaryHoldResponse {
  reservationId: string;
  expiresAt: string;
  slotStartTime: string;
  slotEndTime: string;
}

export const appointmentService = {
  async getAvailability(branchId: string, serviceId: string, date: string): Promise<AvailabilityResponse> {
    const res = await api.get<ApiResponse<AvailabilityResponse>>('/availability', {
      params: { branchId, serviceId, date },
    });
    return res.data.data!;
  },

  async reserveSlot(branchId: string, serviceId: string, slotStartTime: string, slotEndTime: string): Promise<TemporaryHoldResponse> {
    const res = await api.post<ApiResponse<TemporaryHoldResponse>>('/availability/reserve', {
      branchId,
      serviceId,
      slotStartTime,
      slotEndTime,
    });
    return res.data.data!;
  },

  async releaseReservation(reservationId: string): Promise<void> {
    await api.delete(`/availability/reserve/${reservationId}`);
  },

  async bookAppointment(data: {
    branchId: string;
    serviceId: string;
    startTime: string;
    notes?: string;
    reservationId?: string;
  }, idempotencyKey?: string): Promise<Appointment> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    const res = await api.post<ApiResponse<Appointment>>('/appointments', data, { headers });
    return res.data.data!;
  },

  async getAppointments(params?: { branchId?: string; date?: string; status?: string }): Promise<Appointment[]> {
    const res = await api.get<ApiResponse<Appointment[]>>('/appointments', { params });
    return res.data.data!;
  },

  async getAppointment(id: string): Promise<Appointment> {
    const res = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return res.data.data!;
  },

  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const res = await api.post<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, { reason });
    return res.data.data!;
  },

  async rescheduleAppointment(id: string, newStartTime: string, reason?: string): Promise<Appointment> {
    const res = await api.post<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, {
      newStartTime,
      reason,
    });
    return res.data.data!;
  },

  async updateStatus(id: string, status: string, reason?: string): Promise<Appointment> {
    const res = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status, reason });
    return res.data.data!;
  }
};
