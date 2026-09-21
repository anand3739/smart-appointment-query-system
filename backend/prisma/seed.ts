import { PrismaClient, Role, PriorityLevel, QueueStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records if any
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.temporaryReservation.deleteMany();
  await prisma.appointmentHistory.deleteMany();
  await prisma.appointmentResource.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Create Branches
  const downtownBranch = await prisma.branch.create({
    data: {
      name: 'Downtown Flagship Hub',
      address: '100 Central Avenue, Suite 400',
      phone: '+1 (555) 019-2831',
      email: 'downtown@queueflow.com',
      isActive: true,
    },
  });

  const westsideBranch = await prisma.branch.create({
    data: {
      name: 'Westside Medical & Services Centre',
      address: '742 Evergreen Parkway',
      phone: '+1 (555) 019-9482',
      email: 'westside@queueflow.com',
      isActive: true,
    },
  });

  console.log(' Created Branches:', downtownBranch.name, westsideBranch.name);

  // 3. Create Working Hours (Monday to Friday 09:00 - 17:00, Saturday 10:00 - 14:00, Sunday closed)
  for (const branch of [downtownBranch, westsideBranch]) {
    for (let day = 0; day <= 6; day++) {
      if (day === 0) {
        // Sunday closed
        await prisma.workingHour.create({
          data: {
            branchId: branch.id,
            dayOfWeek: day,
            openTime: '09:00',
            closeTime: '17:00',
            isClosed: true,
          },
        });
      } else if (day === 6) {
        // Saturday half-day
        await prisma.workingHour.create({
          data: {
            branchId: branch.id,
            dayOfWeek: day,
            openTime: '10:00',
            closeTime: '14:00',
            isClosed: false,
          },
        });
      } else {
        // Mon-Fri
        await prisma.workingHour.create({
          data: {
            branchId: branch.id,
            dayOfWeek: day,
            openTime: '09:00',
            closeTime: '17:00',
            breakStart: '13:00',
            breakEnd: '14:00',
            isClosed: false,
          },
        });
      }
    }
  }

  // 4. Create Holidays
  await prisma.holiday.createMany({
    data: [
      {
        branchId: downtownBranch.id,
        date: new Date('2026-12-25'),
        reason: 'Christmas Day',
      },
      {
        branchId: downtownBranch.id,
        date: new Date('2027-01-01'),
        reason: "New Year's Day",
      },
      {
        branchId: westsideBranch.id,
        date: new Date('2026-12-25'),
        reason: 'Christmas Day',
      },
    ],
  });

  // 5. Create Services
  const consultationService = await prisma.service.create({
    data: {
      name: 'General Consultation',
      description: 'Comprehensive 1-on-1 advisor consultation session',
      durationMinutes: 30,
      price: 50.0,
      capacityPerSlot: 2,
      isActive: true,
      requiredResourceType: 'DESK',
    },
  });

  const priorityService = await prisma.service.create({
    data: {
      name: 'Priority Express Service',
      description: 'Rapid-track expedited verification and dispatch',
      durationMinutes: 15,
      price: 90.0,
      capacityPerSlot: 1,
      isActive: true,
      requiredResourceType: 'COUNTER',
    },
  });

  const diagnosticService = await prisma.service.create({
    data: {
      name: 'Comprehensive Diagnostic Evaluation',
      description: 'In-depth diagnostic check and specialist review',
      durationMinutes: 45,
      price: 140.0,
      capacityPerSlot: 1,
      isActive: true,
      requiredResourceType: 'ROOM',
    },
  });

  const documentService = await prisma.service.create({
    data: {
      name: 'Document Verification & Clearance',
      description: 'Official credential notarization and filing',
      durationMinutes: 20,
      price: 30.0,
      capacityPerSlot: 3,
      isActive: true,
      requiredResourceType: 'BAY',
    },
  });

  console.log(' Created 4 Services');

  // 6. Create Resources
  const downtownResources = await Promise.all([
    prisma.resource.create({
      data: { branchId: downtownBranch.id, name: 'Counter 1', type: 'COUNTER', isActive: true },
    }),
    prisma.resource.create({
      data: { branchId: downtownBranch.id, name: 'Counter 2', type: 'COUNTER', isActive: true },
    }),
    prisma.resource.create({
      data: { branchId: downtownBranch.id, name: 'Consultation Desk A', type: 'DESK', isActive: true },
    }),
    prisma.resource.create({
      data: { branchId: downtownBranch.id, name: 'Consultation Desk B', type: 'DESK', isActive: true },
    }),
    prisma.resource.create({
      data: { branchId: downtownBranch.id, name: 'Diagnostic Room 101', type: 'ROOM', isActive: true },
    }),
    prisma.resource.create({
      data: { branchId: downtownBranch.id, name: 'Express Clearance Bay 1', type: 'BAY', isActive: true },
    }),
  ]);

  const westsideResources = await Promise.all([
    prisma.resource.create({
      data: { branchId: westsideBranch.id, name: 'Desk 1', type: 'DESK', isActive: true },
    }),
    prisma.resource.create({
      data: { branchId: westsideBranch.id, name: 'Counter A', type: 'COUNTER', isActive: true },
    }),
    prisma.resource.create({
      data: { branchId: westsideBranch.id, name: 'Diagnostic Room 201', type: 'ROOM', isActive: true },
    }),
  ]);

  console.log(' Created Resources for both branches');

  // 7. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      fullName: 'Alexander Vance',
      role: Role.ADMIN,
      phone: '+1 (555) 100-0001',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@example.com',
      passwordHash,
      fullName: 'Sarah Jenkins',
      role: Role.STAFF,
      phone: '+1 (555) 100-0002',
      staffBranchId: downtownBranch.id,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'staff2@example.com',
      passwordHash,
      fullName: 'Marcus Chen',
      role: Role.STAFF,
      phone: '+1 (555) 100-0003',
      staffBranchId: westsideBranch.id,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash,
      fullName: 'Emma Watson',
      role: Role.CUSTOMER,
      phone: '+1 (555) 200-0001',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      passwordHash,
      fullName: 'David Miller',
      role: Role.CUSTOMER,
      phone: '+1 (555) 200-0002',
    },
  });

  console.log(' Created Users: Admin, 2 Staff, 2 Customers');

  // 8. Create sample walk-in queue entries for today
  const today = new Date();
  await prisma.queueEntry.create({
    data: {
      queueNumber: 'A-001',
      branchId: downtownBranch.id,
      serviceId: consultationService.id,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      priority: PriorityLevel.NORMAL,
      status: QueueStatus.WAITING,
      checkInTime: new Date(today.getTime() - 15 * 60000), // 15 mins ago
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueNumber: 'E-001',
      branchId: downtownBranch.id,
      serviceId: priorityService.id,
      customerName: 'Robert Langdon (Walk-in)',
      customerPhone: '+1 (555) 333-4444',
      priority: PriorityLevel.EMERGENCY,
      status: QueueStatus.WAITING,
      checkInTime: new Date(today.getTime() - 5 * 60000), // 5 mins ago
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueNumber: 'P-002',
      branchId: downtownBranch.id,
      serviceId: consultationService.id,
      customerId: customer2.id,
      customerName: customer2.fullName,
      customerPhone: customer2.phone,
      priority: PriorityLevel.PRIORITY,
      status: QueueStatus.WAITING,
      checkInTime: new Date(today.getTime() - 10 * 60000), // 10 mins ago
    },
  });

  // 9. Initial Notifications
  await prisma.notification.create({
    data: {
      userId: customer.id,
      type: 'QUEUE_POSITION_CHANGED',
      title: 'Queue Update',
      message: 'You are currently position #2 in the queue at Downtown Flagship Hub.',
      data: { queueNumber: 'A-001' },
      isRead: false,
    },
  });

  console.log(' Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(' Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
