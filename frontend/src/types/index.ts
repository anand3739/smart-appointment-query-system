export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PriorityLevel = 'NORMAL' | 'PRIORITY' | 'EMERGENCY';

export type QueueStatus =
  | 'WAITING'
  | 'CALLED'
  | 'SERVING'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED';

export type WaitlistStatus =
  | 'WAITING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REMINDER'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'WAITLIST_AVAILABLE'
  | 'QUEUE_CALLED'
  | 'QUEUE_POSITION_CHANGED'
  | 'SERVICE_COMPLETED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  staffBranchId?: string | null;
  staffBranch?: Branch | null;
  createdAt: string;
}

export interface WorkingHour {
  id: string;
  branchId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  openTime: string;  // "09:00"
  closeTime: string; // "17:00"
  breakStart?: string | null;
  breakEnd?: string | null;
  isClosed: boolean;
}

export interface Holiday {
  id: string;
  branchId: string;
  date: string;
  reason: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  workingHours?: WorkingHour[];
  holidays?: Holiday[];
  resources?: Resource[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number | string;
  capacityPerSlot: number;
  isActive: boolean;
  requiredResourceType?: string | null;
}

export interface Resource {
  id: string;
  branchId: string;
  name: string;
  type: string;
  isActive: boolean;
  branch?: Branch;
}

export interface AppointmentResource {
  id: string;
  appointmentId: string;
  resourceId: string;
  resource: Resource;
}

export interface AppointmentHistory {
  id: string;
  appointmentId: string;
  previousStatus?: AppointmentStatus | null;
  newStatus: AppointmentStatus;
  reason?: string | null;
  changedById?: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  customerId: string;
  branchId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  customer?: User;
  branch?: Branch;
  service?: Service;
  resources?: AppointmentResource[];
  history?: AppointmentHistory[];
  queueEntry?: QueueEntry | null;
}

export interface QueueEntry {
  id: string;
  queueNumber: string;
  branchId: string;
  serviceId: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  appointmentId?: string | null;
  assignedResourceId?: string | null;
  priority: PriorityLevel;
  status: QueueStatus;
  checkInTime: string;
  calledTime?: string | null;
  serviceStartTime?: string | null;
  serviceEndTime?: string | null;
  notes?: string | null;
  service?: Service;
  assignedResource?: Resource | null;
}

export interface WaitlistEntry {
  id: string;
  customerId: string;
  branchId: string;
  serviceId: string;
  preferredDate: string;
  status: WaitlistStatus;
  offeredSlot?: string | null;
  offeredAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  branch?: Branch;
  service?: Service;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
