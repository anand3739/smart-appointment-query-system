import bcrypt from 'bcryptjs';

export interface MemoryStore {
  users: any[];
  branches: any[];
  services: any[];
  resources: any[];
  workingHours: any[];
  holidays: any[];
  appointments: any[];
  appointmentResources: any[];
  appointmentHistories: any[];
  temporaryReservations: any[];
  waitlistEntries: any[];
  queueEntries: any[];
  notifications: any[];
  auditLogs: any[];
}

export const dbStore: MemoryStore = {
  users: [],
  branches: [],
  services: [],
  resources: [],
  workingHours: [],
  holidays: [],
  appointments: [],
  appointmentResources: [],
  appointmentHistories: [],
  temporaryReservations: [],
  waitlistEntries: [],
  queueEntries: [],
  notifications: [],
  auditLogs: [],
};

let initialized = false;

export function seedMemoryStore() {
  if (initialized) return;
  initialized = true;

  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // Branches
  const downtown = {
    id: 'branch-downtown-001',
    name: 'Downtown Flagship Hub',
    address: '100 Central Avenue, Suite 400',
    phone: '+1 (555) 019-2831',
    email: 'downtown@queueflow.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const westside = {
    id: 'branch-westside-002',
    name: 'Westside Medical & Services Centre',
    address: '742 Evergreen Parkway',
    phone: '+1 (555) 019-9482',
    email: 'westside@queueflow.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.branches.push(downtown, westside);

  // Working Hours (0=Sun to 6=Sat)
  for (const b of [downtown, westside]) {
    for (let day = 0; day <= 6; day++) {
      dbStore.workingHours.push({
        id: `wh-${b.id}-${day}`,
        branchId: b.id,
        dayOfWeek: day,
        openTime: day === 6 ? '10:00' : '09:00',
        closeTime: day === 6 ? '14:00' : '17:00',
        breakStart: day >= 1 && day <= 5 ? '13:00' : null,
        breakEnd: day >= 1 && day <= 5 ? '14:00' : null,
        isClosed: day === 0,
      });
    }
  }

  // Holidays
  dbStore.holidays.push(
    {
      id: 'hol-1',
      branchId: downtown.id,
      date: new Date('2026-12-25'),
      reason: 'Christmas Day',
    },
    {
      id: 'hol-2',
      branchId: downtown.id,
      date: new Date('2027-01-01'),
      reason: "New Year's Day",
    }
  );

  // Services
  const s1 = {
    id: 'srv-001',
    name: 'General Consultation',
    description: 'Comprehensive 1-on-1 advisor consultation session',
    durationMinutes: 30,
    price: 50.0,
    capacityPerSlot: 2,
    isActive: true,
    requiredResourceType: 'DESK',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const s2 = {
    id: 'srv-002',
    name: 'Priority Express Service',
    description: 'Rapid-track expedited verification and dispatch',
    durationMinutes: 15,
    price: 90.0,
    capacityPerSlot: 1,
    isActive: true,
    requiredResourceType: 'COUNTER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const s3 = {
    id: 'srv-003',
    name: 'Comprehensive Diagnostic Evaluation',
    description: 'In-depth diagnostic check and specialist review',
    durationMinutes: 45,
    price: 140.0,
    capacityPerSlot: 1,
    isActive: true,
    requiredResourceType: 'ROOM',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const s4 = {
    id: 'srv-004',
    name: 'Document Verification & Clearance',
    description: 'Official credential notarization and filing',
    durationMinutes: 20,
    price: 30.0,
    capacityPerSlot: 3,
    isActive: true,
    requiredResourceType: 'BAY',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.services.push(s1, s2, s3, s4);

  // Resources
  const res1 = { id: 'res-dt-1', branchId: downtown.id, name: 'Counter 1', type: 'COUNTER', isActive: true };
  const res2 = { id: 'res-dt-2', branchId: downtown.id, name: 'Counter 2', type: 'COUNTER', isActive: true };
  const res3 = { id: 'res-dt-3', branchId: downtown.id, name: 'Consultation Desk A', type: 'DESK', isActive: true };
  const res4 = { id: 'res-dt-4', branchId: downtown.id, name: 'Consultation Desk B', type: 'DESK', isActive: true };
  const res5 = { id: 'res-dt-5', branchId: downtown.id, name: 'Diagnostic Room 101', type: 'ROOM', isActive: true };
  const res6 = { id: 'res-dt-6', branchId: downtown.id, name: 'Express Clearance Bay 1', type: 'BAY', isActive: true };

  const res7 = { id: 'res-ws-1', branchId: westside.id, name: 'Desk 1', type: 'DESK', isActive: true };
  const res8 = { id: 'res-ws-2', branchId: westside.id, name: 'Counter A', type: 'COUNTER', isActive: true };
  const res9 = { id: 'res-ws-3', branchId: westside.id, name: 'Diagnostic Room 201', type: 'ROOM', isActive: true };

  dbStore.resources.push(res1, res2, res3, res4, res5, res6, res7, res8, res9);

  // Users
  const admin = {
    id: 'usr-admin-001',
    email: 'admin@example.com',
    passwordHash,
    fullName: 'Alexander Vance',
    role: 'ADMIN',
    phone: '+1 (555) 100-0001',
    staffBranchId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const staff1 = {
    id: 'usr-staff-001',
    email: 'staff@example.com',
    passwordHash,
    fullName: 'Sarah Jenkins',
    role: 'STAFF',
    phone: '+1 (555) 100-0002',
    staffBranchId: downtown.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const staff2 = {
    id: 'usr-staff-002',
    email: 'staff2@example.com',
    passwordHash,
    fullName: 'Marcus Chen',
    role: 'STAFF',
    phone: '+1 (555) 100-0003',
    staffBranchId: westside.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const customer1 = {
    id: 'usr-cust-001',
    email: 'customer@example.com',
    passwordHash,
    fullName: 'Emma Watson',
    role: 'CUSTOMER',
    phone: '+1 (555) 200-0001',
    staffBranchId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const customer2 = {
    id: 'usr-cust-002',
    email: 'customer2@example.com',
    passwordHash,
    fullName: 'David Miller',
    role: 'CUSTOMER',
    phone: '+1 (555) 200-0002',
    staffBranchId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.users.push(admin, staff1, staff2, customer1, customer2);

  // Walk-in queue items for today
  const now = new Date();
  dbStore.queueEntries.push(
    {
      id: 'qe-001',
      queueNumber: 'A-001',
      branchId: downtown.id,
      serviceId: s1.id,
      customerId: customer1.id,
      customerName: customer1.fullName,
      customerPhone: customer1.phone,
      priority: 'NORMAL',
      status: 'WAITING',
      checkInTime: new Date(now.getTime() - 15 * 60000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'qe-002',
      queueNumber: 'E-001',
      branchId: downtown.id,
      serviceId: s2.id,
      customerId: null,
      customerName: 'Robert Langdon (Walk-in)',
      customerPhone: '+1 (555) 333-4444',
      priority: 'EMERGENCY',
      status: 'WAITING',
      checkInTime: new Date(now.getTime() - 5 * 60000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'qe-003',
      queueNumber: 'P-002',
      branchId: downtown.id,
      serviceId: s1.id,
      customerId: customer2.id,
      customerName: customer2.fullName,
      customerPhone: customer2.phone,
      priority: 'PRIORITY',
      status: 'WAITING',
      checkInTime: new Date(now.getTime() - 10 * 60000),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  // Notifications
  dbStore.notifications.push({
    id: 'notif-001',
    userId: customer1.id,
    type: 'QUEUE_POSITION_CHANGED',
    title: 'Queue Update',
    message: 'You are currently position #2 in the queue at Downtown Flagship Hub.',
    data: { queueNumber: 'A-001' },
    isRead: false,
    createdAt: new Date(),
  });
}
