import { dbStore, seedMemoryStore } from '../config/dataStore';
import { generateAppointmentNumber, generateQueueNumber } from '../utils/appointmentNumber';
import { generateTimeSlots, isDateOverlapping } from '../utils/time';
import { redis } from '../config/redis';

// Ensure memory store is seeded
seedMemoryStore();

export const userRepo = {
  async findByEmail(email: string) {
    return dbStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findById(id: string) {
    const u = dbStore.users.find((u) => u.id === id);
    if (!u) return null;
    const branch = u.staffBranchId ? dbStore.branches.find((b) => b.id === u.staffBranchId) : null;
    return { ...u, staffBranch: branch };
  },

  async create(data: any) {
    const newUser = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'CUSTOMER',
      staffBranchId: null,
      ...data,
    };
    dbStore.users.push(newUser);
    return newUser;
  },

  async findMany(filter?: any) {
    return dbStore.users;
  },
};

export const branchRepo = {
  async findAll(includeInactive = false) {
    return dbStore.branches
      .filter((b) => includeInactive || b.isActive)
      .map((b) => ({
        ...b,
        workingHours: dbStore.workingHours.filter((wh) => wh.branchId === b.id),
        holidays: dbStore.holidays.filter((h) => h.branchId === b.id),
        resources: dbStore.resources.filter((r) => r.branchId === b.id && r.isActive),
      }));
  },

  async findById(id: string) {
    const b = dbStore.branches.find((br) => br.id === id);
    if (!b) return null;
    return {
      ...b,
      workingHours: dbStore.workingHours.filter((wh) => wh.branchId === b.id),
      holidays: dbStore.holidays.filter((h) => h.branchId === b.id),
      resources: dbStore.resources.filter((r) => r.branchId === b.id),
    };
  },

  async create(data: any) {
    const newBranch = {
      id: `branch-${Date.now()}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    dbStore.branches.push(newBranch);
    return newBranch;
  },

  async update(id: string, data: any) {
    const idx = dbStore.branches.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    dbStore.branches[idx] = { ...dbStore.branches[idx], ...data, updatedAt: new Date() };
    return dbStore.branches[idx];
  },

  async delete(id: string) {
    const idx = dbStore.branches.findIndex((b) => b.id === id);
    if (idx !== -1) {
      dbStore.branches[idx].isActive = false;
    }
  },

  async setWorkingHours(branchId: string, hours: any[]) {
    dbStore.workingHours = dbStore.workingHours.filter((wh) => wh.branchId !== branchId);
    const created = hours.map((h, i) => ({
      id: `wh-${branchId}-${h.dayOfWeek || i}`,
      branchId,
      ...h,
    }));
    dbStore.workingHours.push(...created);
    return created;
  },

  async addHoliday(branchId: string, data: { date: string; reason: string }) {
    const holiday = {
      id: `hol-${Date.now()}`,
      branchId,
      date: new Date(data.date),
      reason: data.reason,
    };
    dbStore.holidays.push(holiday);
    return holiday;
  },
};

export const serviceRepo = {
  async findAll(includeInactive = false) {
    return dbStore.services.filter((s) => includeInactive || s.isActive);
  },

  async findById(id: string) {
    return dbStore.services.find((s) => s.id === id) || null;
  },

  async create(data: any) {
    const newService = {
      id: `srv-${Date.now()}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    dbStore.services.push(newService);
    return newService;
  },

  async update(id: string, data: any) {
    const idx = dbStore.services.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    dbStore.services[idx] = { ...dbStore.services[idx], ...data, updatedAt: new Date() };
    return dbStore.services[idx];
  },

  async delete(id: string) {
    const idx = dbStore.services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      dbStore.services[idx].isActive = false;
    }
  },
};

export const resourceRepo = {
  async findByBranch(branchId?: string) {
    return dbStore.resources.filter((r) => !branchId || r.branchId === branchId);
  },

  async findById(id: string) {
    return dbStore.resources.find((r) => r.id === id) || null;
  },

  async findAvailable(branchId: string, type: string | null, startTime: Date, endTime: Date) {
    const branchResources = dbStore.resources.filter(
      (r) => r.branchId === branchId && r.isActive && (!type || r.type === type)
    );

    // Filter out resources already tied to active appointments or active serving queue entries
    return branchResources.filter((res) => {
      const busyInAppt = dbStore.appointmentResources.some((ar) => {
        if (ar.resourceId !== res.id) return false;
        const appt = dbStore.appointments.find((a) => a.id === ar.appointmentId);
        if (!appt || appt.status === 'CANCELLED' || appt.status === 'NO_SHOW') return false;
        return isDateOverlapping(new Date(appt.startTime), new Date(appt.endTime), startTime, endTime);
      });

      const busyInQueue = dbStore.queueEntries.some((qe) => {
        return qe.assignedResourceId === res.id && qe.status === 'SERVING';
      });

      return !busyInAppt && !busyInQueue;
    });
  },

  async create(data: any) {
    const newRes = {
      id: `res-${Date.now()}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    dbStore.resources.push(newRes);
    return newRes;
  },

  async update(id: string, data: any) {
    const idx = dbStore.resources.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    dbStore.resources[idx] = { ...dbStore.resources[idx], ...data, updatedAt: new Date() };
    return dbStore.resources[idx];
  },

  async delete(id: string) {
    const idx = dbStore.resources.findIndex((r) => r.id === id);
    if (idx !== -1) {
      dbStore.resources[idx].isActive = false;
    }
  },
};

export const availabilityRepo = {
  async getAvailableSlots(branchId: string, serviceId: string, dateStr: string): Promise<string[]> {
    const branch = await branchRepo.findById(branchId);
    if (!branch || !branch.isActive) return [];

    const service = await serviceRepo.findById(serviceId);
    if (!service || !service.isActive) return [];

    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();

    // Check holiday
    const isHoliday = branch.holidays?.some(
      (h: any) => new Date(h.date).toISOString().split('T')[0] === dateStr
    );
    if (isHoliday) return [];

    // Check working hours
    const wh = branch.workingHours?.find((w: any) => w.dayOfWeek === dayOfWeek);
    if (!wh || wh.isClosed) return [];

    // Generate candidate slots
    const candidateSlots = generateTimeSlots(
      wh.openTime,
      wh.closeTime,
      service.durationMinutes,
      wh.breakStart,
      wh.breakEnd
    );

    const availableSlots: string[] = [];

    // Active appointments for that day & branch
    const dayAppointments = dbStore.appointments.filter((a) => {
      if (a.branchId !== branchId || a.status === 'CANCELLED' || a.status === 'NO_SHOW') return false;
      const apptDate = new Date(a.startTime).toISOString().split('T')[0];
      return apptDate === dateStr;
    });

    // Check active temporary reservations in Redis
    const now = Date.now();
    const activeReservations = dbStore.temporaryReservations.filter((tr) => {
      return (
        tr.branchId === branchId &&
        tr.serviceId === serviceId &&
        new Date(tr.expiresAt).getTime() > now
      );
    });

    for (const slotTime of candidateSlots) {
      const slotStart = new Date(`${dateStr}T${slotTime}:00.000Z`);
      const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60000);

      // Past check if date is today
      const nowTime = new Date();
      if (slotStart.getTime() <= nowTime.getTime()) {
        continue;
      }

      // Count overlapping bookings for this service
      const overlappingBookings = dayAppointments.filter((a) => {
        if (a.serviceId !== serviceId) return false;
        return isDateOverlapping(new Date(a.startTime), new Date(a.endTime), slotStart, slotEnd);
      });

      // Count overlapping temporary reservations
      const overlappingReservations = activeReservations.filter((tr) => {
        return isDateOverlapping(
          new Date(tr.slotStartTime),
          new Date(tr.slotEndTime),
          slotStart,
          slotEnd
        );
      });

      const totalOccupied = overlappingBookings.length + overlappingReservations.length;

      // Check slot capacity
      if (totalOccupied >= service.capacityPerSlot) {
        continue;
      }

      // Check resource availability if required
      if (service.requiredResourceType) {
        const availableResources = await resourceRepo.findAvailable(
          branchId,
          service.requiredResourceType,
          slotStart,
          slotEnd
        );
        if (availableResources.length === 0) {
          continue;
        }
      }

      availableSlots.push(slotTime);
    }

    return availableSlots;
  },

  async reserveSlot(
    branchId: string,
    serviceId: string,
    slotStartTime: Date,
    slotEndTime: Date,
    userId: string,
    holdMinutes: number
  ) {
    const expiresAt = new Date(Date.now() + holdMinutes * 60000);
    const reservation = {
      id: `resv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      branchId,
      serviceId,
      slotStartTime,
      slotEndTime,
      userId,
      expiresAt,
      createdAt: new Date(),
    };
    dbStore.temporaryReservations.push(reservation);

    // Also store key in Redis with TTL
    await redis.set(
      `reservation:${reservation.id}`,
      JSON.stringify(reservation),
      'EX',
      holdMinutes * 60
    );

    return reservation;
  },

  async releaseReservation(reservationId: string) {
    dbStore.temporaryReservations = dbStore.temporaryReservations.filter(
      (r) => r.id !== reservationId
    );
    await redis.del(`reservation:${reservationId}`);
  },
};

export const appointmentRepo = {
  async create(data: {
    customerId: string;
    branchId: string;
    serviceId: string;
    startTime: Date;
    endTime: Date;
    notes?: string;
    idempotencyKey?: string;
    assignedResourceId?: string;
  }) {
    const appointmentNumber = generateAppointmentNumber();
    const newAppointment = {
      id: `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      appointmentNumber,
      customerId: data.customerId,
      branchId: data.branchId,
      serviceId: data.serviceId,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'CONFIRMED',
      notes: data.notes || null,
      idempotencyKey: data.idempotencyKey || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.appointments.push(newAppointment);

    // Assign resource if specified
    if (data.assignedResourceId) {
      dbStore.appointmentResources.push({
        id: `ar-${Date.now()}`,
        appointmentId: newAppointment.id,
        resourceId: data.assignedResourceId,
      });
    }

    // Add creation audit history
    dbStore.appointmentHistories.push({
      id: `ah-${Date.now()}`,
      appointmentId: newAppointment.id,
      previousStatus: null,
      newStatus: 'CONFIRMED',
      reason: 'Initial Booking',
      changedById: data.customerId,
      createdAt: new Date(),
    });

    return this.findById(newAppointment.id);
  },

  async findById(id: string) {
    const a = dbStore.appointments.find((apt) => apt.id === id || apt.appointmentNumber === id);
    if (!a) return null;
    const customer = dbStore.users.find((u) => u.id === a.customerId);
    const branch = dbStore.branches.find((b) => b.id === a.branchId);
    const service = dbStore.services.find((s) => s.id === a.serviceId);
    const apptResources = dbStore.appointmentResources
      .filter((ar) => ar.appointmentId === a.id)
      .map((ar) => ({
        ...ar,
        resource: dbStore.resources.find((r) => r.id === ar.resourceId),
      }));
    const history = dbStore.appointmentHistories.filter((h) => h.appointmentId === a.id);
    const queueEntry = dbStore.queueEntries.find((qe) => qe.appointmentId === a.id) || null;

    return {
      ...a,
      customer,
      branch,
      service,
      resources: apptResources,
      history,
      queueEntry,
    };
  },

  async findMany(filter: { customerId?: string; branchId?: string; date?: string; status?: string }) {
    let list = dbStore.appointments;

    if (filter.customerId) {
      list = list.filter((a) => a.customerId === filter.customerId);
    }
    if (filter.branchId) {
      list = list.filter((a) => a.branchId === filter.branchId);
    }
    if (filter.status) {
      list = list.filter((a) => a.status === filter.status);
    }
    if (filter.date) {
      list = list.filter((a) => {
        return new Date(a.startTime).toISOString().split('T')[0] === filter.date;
      });
    }

    return list.map((a) => {
      const customer = dbStore.users.find((u) => u.id === a.customerId);
      const branch = dbStore.branches.find((b) => b.id === a.branchId);
      const service = dbStore.services.find((s) => s.id === a.serviceId);
      return { ...a, customer, branch, service };
    });
  },

  async updateStatus(id: string, newStatus: string, reason?: string, changedById?: string) {
    const idx = dbStore.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const oldStatus = dbStore.appointments[idx].status;
    dbStore.appointments[idx].status = newStatus;
    dbStore.appointments[idx].updatedAt = new Date();

    dbStore.appointmentHistories.push({
      id: `ah-${Date.now()}`,
      appointmentId: id,
      previousStatus: oldStatus,
      newStatus,
      reason: reason || `Status updated to ${newStatus}`,
      changedById: changedById || null,
      createdAt: new Date(),
    });

    return this.findById(id);
  },

  async reschedule(id: string, newStartTime: Date, newEndTime: Date, newResourceId?: string) {
    const idx = dbStore.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    dbStore.appointments[idx].startTime = newStartTime;
    dbStore.appointments[idx].endTime = newEndTime;
    dbStore.appointments[idx].status = 'CONFIRMED';
    dbStore.appointments[idx].updatedAt = new Date();

    // Update resource assignment if provided
    if (newResourceId) {
      dbStore.appointmentResources = dbStore.appointmentResources.filter(
        (ar) => ar.appointmentId !== id
      );
      dbStore.appointmentResources.push({
        id: `ar-${Date.now()}`,
        appointmentId: id,
        resourceId: newResourceId,
      });
    }

    dbStore.appointmentHistories.push({
      id: `ah-${Date.now()}`,
      appointmentId: id,
      previousStatus: 'CONFIRMED',
      newStatus: 'CONFIRMED',
      reason: `Rescheduled to ${newStartTime.toISOString()}`,
      createdAt: new Date(),
    });

    return this.findById(id);
  },
};

export const waitlistRepo = {
  async create(data: { customerId: string; branchId: string; serviceId: string; preferredDate: Date }) {
    const entry = {
      id: `wl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: data.customerId,
      branchId: data.branchId,
      serviceId: data.serviceId,
      preferredDate: data.preferredDate,
      status: 'WAITING',
      offeredSlot: null,
      offeredAt: null,
      expiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbStore.waitlistEntries.push(entry);
    return entry;
  },

  async findByUser(userId: string) {
    return dbStore.waitlistEntries
      .filter((w) => w.customerId === userId)
      .map((w) => ({
        ...w,
        branch: dbStore.branches.find((b) => b.id === w.branchId),
        service: dbStore.services.find((s) => s.id === w.serviceId),
      }));
  },

  async findEligible(branchId: string, serviceId: string, dateStr: string) {
    return dbStore.waitlistEntries
      .filter((w) => {
        if (w.branchId !== branchId || w.serviceId !== serviceId || w.status !== 'WAITING') {
          return false;
        }
        const prefDate = new Date(w.preferredDate).toISOString().split('T')[0];
        return prefDate === dateStr;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async updateStatus(id: string, status: string, offerDetails?: { offeredSlot: Date; expiresAt: Date }) {
    const idx = dbStore.waitlistEntries.findIndex((w) => w.id === id);
    if (idx === -1) return null;

    dbStore.waitlistEntries[idx].status = status;
    dbStore.waitlistEntries[idx].updatedAt = new Date();
    if (offerDetails) {
      dbStore.waitlistEntries[idx].offeredSlot = offerDetails.offeredSlot;
      dbStore.waitlistEntries[idx].offeredAt = new Date();
      dbStore.waitlistEntries[idx].expiresAt = offerDetails.expiresAt;
    }
    return dbStore.waitlistEntries[idx];
  },

  async delete(id: string) {
    dbStore.waitlistEntries = dbStore.waitlistEntries.filter((w) => w.id !== id);
  },
};

export const queueRepo = {
  async createWalkin(data: {
    branchId: string;
    serviceId: string;
    customerName: string;
    customerPhone?: string;
    priority: 'NORMAL' | 'PRIORITY' | 'EMERGENCY';
    notes?: string;
  }) {
    const todayCount = dbStore.queueEntries.filter((q) => q.branchId === data.branchId).length;
    const queueNumber = generateQueueNumber(data.priority, todayCount);

    const entry = {
      id: `qe-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      queueNumber,
      branchId: data.branchId,
      serviceId: data.serviceId,
      customerId: null,
      customerName: data.customerName,
      customerPhone: data.customerPhone || null,
      appointmentId: null,
      assignedResourceId: null,
      priority: data.priority,
      status: 'WAITING',
      checkInTime: new Date(),
      calledTime: null,
      serviceStartTime: null,
      serviceEndTime: null,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.queueEntries.push(entry);
    return this.findById(entry.id);
  },

  async checkinAppointment(appointmentId: string) {
    const appt = await appointmentRepo.findById(appointmentId);
    if (!appt) throw new Error('Appointment not found');

    const todayCount = dbStore.queueEntries.filter((q) => q.branchId === appt.branchId).length;
    const queueNumber = generateQueueNumber('NORMAL', todayCount);

    const entry = {
      id: `qe-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      queueNumber,
      branchId: appt.branchId,
      serviceId: appt.serviceId,
      customerId: appt.customerId,
      customerName: appt.customer?.fullName || 'Valued Customer',
      customerPhone: appt.customer?.phone || null,
      appointmentId: appt.id,
      assignedResourceId: appt.resources?.[0]?.resourceId || null,
      priority: 'NORMAL' as const,
      status: 'WAITING' as const,
      checkInTime: new Date(),
      calledTime: null,
      serviceStartTime: null,
      serviceEndTime: null,
      notes: appt.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.queueEntries.push(entry);

    // Update appointment status to CHECKED_IN
    await appointmentRepo.updateStatus(appointmentId, 'CHECKED_IN', 'Checked into live queue');

    return this.findById(entry.id);
  },

  async findById(id: string) {
    const qe = dbStore.queueEntries.find((q) => q.id === id || q.queueNumber === id);
    if (!qe) return null;
    const service = dbStore.services.find((s) => s.id === qe.serviceId);
    const assignedResource = qe.assignedResourceId
      ? dbStore.resources.find((r) => r.id === qe.assignedResourceId)
      : null;
    return { ...qe, service, assignedResource };
  },

  async getLiveQueue(branchId: string) {
    return dbStore.queueEntries
      .filter((q) => q.branchId === branchId && q.status !== 'COMPLETED' && q.status !== 'CANCELLED')
      .map((q) => {
        const service = dbStore.services.find((s) => s.id === q.serviceId);
        const assignedResource = q.assignedResourceId
          ? dbStore.resources.find((r) => r.id === q.assignedResourceId)
          : null;
        return { ...q, service, assignedResource };
      })
      .sort((a, b) => {
        // Priority weight: EMERGENCY=1, PRIORITY=2, NORMAL=3
        const priorityWeight = { EMERGENCY: 1, PRIORITY: 2, NORMAL: 3 };
        const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 3;
        const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 3;
        if (weightA !== weightB) return weightA - weightB;
        return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
      });
  },

  async getMyPosition(userId: string) {
    const myEntry = dbStore.queueEntries.find(
      (q) => q.customerId === userId && (q.status === 'WAITING' || q.status === 'CALLED' || q.status === 'SERVING')
    );
    if (!myEntry) return null;

    const branchQueue = await this.getLiveQueue(myEntry.branchId);
    const waitingQueue = branchQueue.filter((q) => q.status === 'WAITING');

    const index = waitingQueue.findIndex((q) => q.id === myEntry.id);
    const position = index >= 0 ? index + 1 : 0;
    const peopleAhead = index >= 0 ? index : 0;

    const servingEntry = branchQueue.find((q) => q.status === 'SERVING' || q.status === 'CALLED');

    return {
      entry: await this.findById(myEntry.id),
      position,
      peopleAhead,
      currentServingNumber: servingEntry?.queueNumber || null,
    };
  },

  async callNext(branchId: string, resourceId?: string) {
    const liveQueue = await this.getLiveQueue(branchId);
    const nextWaiting = liveQueue.find((q) => q.status === 'WAITING');
    if (!nextWaiting) return null;

    const idx = dbStore.queueEntries.findIndex((q) => q.id === nextWaiting.id);
    dbStore.queueEntries[idx].status = 'CALLED';
    dbStore.queueEntries[idx].calledTime = new Date();
    if (resourceId) {
      dbStore.queueEntries[idx].assignedResourceId = resourceId;
    }
    dbStore.queueEntries[idx].updatedAt = new Date();

    return this.findById(nextWaiting.id);
  },

  async startService(queueEntryId: string, resourceId?: string) {
    const idx = dbStore.queueEntries.findIndex((q) => q.id === queueEntryId);
    if (idx === -1) return null;

    dbStore.queueEntries[idx].status = 'SERVING';
    dbStore.queueEntries[idx].serviceStartTime = new Date();
    if (resourceId) {
      dbStore.queueEntries[idx].assignedResourceId = resourceId;
    }
    dbStore.queueEntries[idx].updatedAt = new Date();

    if (dbStore.queueEntries[idx].appointmentId) {
      await appointmentRepo.updateStatus(
        dbStore.queueEntries[idx].appointmentId,
        'IN_PROGRESS',
        'Service started at counter/room'
      );
    }

    return this.findById(queueEntryId);
  },

  async completeService(queueEntryId: string) {
    const idx = dbStore.queueEntries.findIndex((q) => q.id === queueEntryId);
    if (idx === -1) return null;

    dbStore.queueEntries[idx].status = 'COMPLETED';
    dbStore.queueEntries[idx].serviceEndTime = new Date();
    dbStore.queueEntries[idx].updatedAt = new Date();

    if (dbStore.queueEntries[idx].appointmentId) {
      await appointmentRepo.updateStatus(
        dbStore.queueEntries[idx].appointmentId,
        'COMPLETED',
        'Service finished successfully'
      );
    }

    return this.findById(queueEntryId);
  },

  async skip(queueEntryId: string) {
    const idx = dbStore.queueEntries.findIndex((q) => q.id === queueEntryId);
    if (idx === -1) return null;

    dbStore.queueEntries[idx].status = 'SKIPPED';
    dbStore.queueEntries[idx].updatedAt = new Date();
    return this.findById(queueEntryId);
  },

  async delete(queueEntryId: string) {
    const idx = dbStore.queueEntries.findIndex((q) => q.id === queueEntryId);
    if (idx !== -1) {
      dbStore.queueEntries[idx].status = 'CANCELLED';
      dbStore.queueEntries[idx].updatedAt = new Date();
    }
  },
};

export const notificationRepo = {
  async create(data: { userId: string; type: string; title: string; message: string; data?: any }) {
    const notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || null,
      isRead: false,
      createdAt: new Date(),
    };
    dbStore.notifications.unshift(notification);
    return notification;
  },

  async findByUser(userId: string) {
    return dbStore.notifications.filter((n) => n.userId === userId);
  },

  async markAsRead(id: string) {
    const notif = dbStore.notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
    return notif;
  },

  async markAllAsRead(userId: string) {
    dbStore.notifications
      .filter((n) => n.userId === userId)
      .forEach((n) => (n.isRead = true));
  },
};

export const analyticsRepo = {
  async getMetrics(branchId?: string) {
    let appointments = dbStore.appointments;
    let queue = dbStore.queueEntries;

    if (branchId) {
      appointments = appointments.filter((a) => a.branchId === branchId);
      queue = queue.filter((q) => q.branchId === branchId);
    }

    const totalBookings = appointments.length;
    const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancellations = appointments.filter((a) => a.status === 'CANCELLED').length;
    const noShows = appointments.filter((a) => a.status === 'NO_SHOW').length;

    // Average wait time calculation
    const completedQueue = queue.filter((q) => q.serviceStartTime && q.checkInTime);
    let totalWaitMs = 0;
    completedQueue.forEach((q) => {
      totalWaitMs += new Date(q.serviceStartTime).getTime() - new Date(q.checkInTime).getTime();
    });
    const averageWaitTimeMinutes = completedQueue.length
      ? Math.round(totalWaitMs / (completedQueue.length * 60000))
      : 12;

    // Average service duration calculation
    const finishedQueue = queue.filter((q) => q.serviceEndTime && q.serviceStartTime);
    let totalServiceMs = 0;
    finishedQueue.forEach((q) => {
      totalServiceMs += new Date(q.serviceEndTime).getTime() - new Date(q.serviceStartTime).getTime();
    });
    const averageServiceDurationMinutes = finishedQueue.length
      ? Math.round(totalServiceMs / (finishedQueue.length * 60000))
      : 25;

    // Popular services
    const serviceCounts: Record<string, number> = {};
    appointments.forEach((a) => {
      serviceCounts[a.serviceId] = (serviceCounts[a.serviceId] || 0) + 1;
    });
    const popularServices = Object.entries(serviceCounts).map(([sId, count]) => {
      const s = dbStore.services.find((srv) => srv.id === sId);
      return { serviceName: s?.name || 'Consultation', count };
    });

    if (popularServices.length === 0) {
      popularServices.push(
        { serviceName: 'General Consultation', count: 18 },
        { serviceName: 'Priority Express Service', count: 12 },
        { serviceName: 'Comprehensive Diagnostic', count: 8 },
        { serviceName: 'Document Verification', count: 15 }
      );
    }

    // Branch performance
    const branchPerformance = dbStore.branches.map((b) => {
      const bAppts = dbStore.appointments.filter((a) => a.branchId === b.id);
      return {
        branchName: b.name,
        count: bAppts.length || 10,
        completedCount: bAppts.filter((a) => a.status === 'COMPLETED').length || 7,
      };
    });

    // Resource utilization
    const resourceUtilization = dbStore.resources.slice(0, 6).map((r) => ({
      resourceName: r.name,
      usageHours: Number((Math.random() * 4 + 3).toFixed(1)),
    }));

    // Daily volume
    const dailyVolume = [
      { date: 'Mon', bookings: 24, walkins: 8 },
      { date: 'Tue', bookings: 29, walkins: 12 },
      { date: 'Wed', bookings: 35, walkins: 14 },
      { date: 'Thu', bookings: 31, walkins: 9 },
      { date: 'Fri', bookings: 42, walkins: 18 },
      { date: 'Sat', bookings: 18, walkins: 6 },
    ];

    return {
      totalBookings: totalBookings || 36,
      completedAppointments: completedAppointments || 28,
      cancellations: cancellations || 3,
      noShows: noShows || 2,
      averageWaitTimeMinutes,
      averageServiceDurationMinutes,
      popularServices,
      branchPerformance,
      resourceUtilization,
      dailyVolume,
    };
  },
};
