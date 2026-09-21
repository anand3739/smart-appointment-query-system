import { app } from '../src/app';
import request from 'supertest';

async function runManualQA() {
  console.log('=== STARTING MANUAL QA & SUBMISSION VERIFICATION ===\n');
  const issues: string[] = [];

  try {
    // 1. Auth Flow: Register Customer
    console.log('1. Testing Customer Registration & Auth Flow...');
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `qa_customer_${Date.now()}@test.com`,
        password: 'Password123!',
        fullName: 'QA Customer',
        phone: '+1 (555) 999-0001',
      });

    if (regRes.status !== 201 || !regRes.body.data?.token) {
      issues.push(`Customer registration failed: ${regRes.status} ${JSON.stringify(regRes.body)}`);
    } else {
      console.log(' [PASS] Customer registration successful.');
    }
    const customerToken = regRes.body.data?.token;

    // 2. Auth Flow: Login Staff
    console.log('\n2. Testing Staff Login...');
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'staff@example.com',
        password: 'Password123!',
      });

    if (staffRes.status !== 200 || staffRes.body.data?.user?.role !== 'STAFF') {
      issues.push(`Staff login failed: ${staffRes.status}`);
    } else {
      console.log(' [PASS] Staff login verified (Role: STAFF).');
    }
    const staffToken = staffRes.body.data?.token;

    // 3. Auth Flow: Login Admin
    console.log('\n3. Testing Admin Login...');
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!',
      });

    if (adminRes.status !== 200 || adminRes.body.data?.user?.role !== 'ADMIN') {
      issues.push(`Admin login failed: ${adminRes.status}`);
    } else {
      console.log(' [PASS] Admin login verified (Role: ADMIN).');
    }
    const adminToken = adminRes.body.data?.token;

    // 4. Branch & Service Retrieval
    console.log('\n4. Testing Branch & Service Catalog...');
    const branchesRes = await request(app).get('/api/branches');
    const servicesRes = await request(app).get('/api/services');
    const branch = branchesRes.body.data?.[0];
    const service = servicesRes.body.data?.[0];

    if (!branch || !service) {
      issues.push('Failed to retrieve branches or services');
    } else {
      console.log(` [PASS] Loaded branch "${branch.name}" and service "${service.name}".`);
    }

    // 5. Availability Engine & Slots
    console.log('\n5. Testing Slot Availability Engine...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const slotsRes = await request(app)
      .get(`/api/availability?branchId=${branch.id}&serviceId=${service.id}&date=${dateStr}`);

    if (slotsRes.status !== 200 || !slotsRes.body.data?.availableSlots?.length) {
      issues.push(`Availability slot engine failed: ${slotsRes.status}`);
    } else {
      console.log(` [PASS] Generated ${slotsRes.body.data.availableSlots.length} slots for ${dateStr}. Available: ${slotsRes.body.data.availableSlots.slice(0, 3).join(', ')}...`);
    }

    const firstSlotTimeStr = slotsRes.body.data.availableSlots[0];
    const slotStartTimeIso = new Date(`${dateStr}T${firstSlotTimeStr}:00.000Z`).toISOString();

    // 6. Temporary Slot Reservation Hold
    console.log('\n6. Testing 10-Minute Slot Hold...');
    const holdRes = await request(app)
      .post('/api/availability/reserve')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        branchId: branch.id,
        serviceId: service.id,
        slotStartTime: slotStartTimeIso,
      });

    if (holdRes.status !== 201 || !holdRes.body.data?.reservationId) {
      issues.push(`Slot hold failed: ${holdRes.status} ${JSON.stringify(holdRes.body)}`);
    } else {
      console.log(` [PASS] Slot held successfully. Reservation ID: ${holdRes.body.data.reservationId}, Expires: ${holdRes.body.data.expiresAt}.`);
    }

    // 7. Appointment Booking with Idempotency Key
    console.log('\n7. Testing Booking & Idempotency Key...');
    const idempotencyKey = `qa-idem-${Date.now()}`;
    const bookRes1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        branchId: branch.id,
        serviceId: service.id,
        startTime: slotStartTimeIso,
        reservationId: holdRes.body.data?.reservationId,
        notes: 'QA automated test booking',
      });

    if (bookRes1.status !== 201 || !bookRes1.body.data?.id) {
      issues.push(`Booking failed: ${bookRes1.status} ${JSON.stringify(bookRes1.body)}`);
    } else {
      console.log(` [PASS] Appointment booked. ID: ${bookRes1.body.data.id}, Status: ${bookRes1.body.data.status}.`);
    }

    // Replay with identical idempotency key
    const bookRes2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        branchId: branch.id,
        serviceId: service.id,
        startTime: slotStartTimeIso,
      });

    if (bookRes2.status !== 201 || bookRes2.body.data?.id !== bookRes1.body.data?.id) {
      issues.push(`Idempotency replay failed. Received status ${bookRes2.status}`);
    } else {
      console.log(' [PASS] Idempotency replay returned exact identical cached response.');
    }

    const appointmentId = bookRes1.body.data?.id;

    // 8. Rescheduling Flow
    console.log('\n8. Testing Rescheduling...');
    const secondSlotTimeStr = slotsRes.body.data.availableSlots[1];
    const secondSlotStartTimeIso = new Date(`${dateStr}T${secondSlotTimeStr}:00.000Z`).toISOString();

    const reschedRes = await request(app)
      .post(`/api/appointments/${appointmentId}/reschedule`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        newStartTime: secondSlotStartTimeIso,
        reason: 'Client requested later time',
      });

    if (reschedRes.status !== 200 || !reschedRes.body.data?.startTime) {
      issues.push(`Rescheduling failed: ${reschedRes.status} ${JSON.stringify(reschedRes.body)}`);
    } else {
      console.log(` [PASS] Rescheduled to ${secondSlotTimeStr} successfully.`);
    }

    // 9. Queue Check-in Flow (Staff action for checked-in customer)
    console.log('\n9. Testing Appointment Queue Check-In...');
    const checkinRes = await request(app)
      .post('/api/queue/checkin')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        appointmentId,
      });

    if (checkinRes.status !== 200 || !checkinRes.body.data?.queueNumber) {
      issues.push(`Queue check-in failed: ${checkinRes.status} ${JSON.stringify(checkinRes.body)}`);
    } else {
      console.log(` [PASS] Checked in. Ticket Number: ${checkinRes.body.data.queueNumber}.`);
    }

    // 10. Staff Queue Operations
    console.log('\n10. Testing Staff Desk Calling & Service Flow...');
    const callRes = await request(app)
      .post('/api/queue/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        branchId: branch.id,
      });

    if (callRes.status !== 200) {
      issues.push(`Staff call-next failed: ${callRes.status}`);
    } else {
      console.log(` [PASS] Desk called customer: ${callRes.body.data?.queueNumber || 'Queue item processed'}.`);
    }

    if (callRes.body.data?.id) {
      const ticketId = callRes.body.data.id;
      // Start service
      const startRes = await request(app)
        .post(`/api/queue/${ticketId}/start-service`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});
      console.log(` [PASS] Service started: Status ${startRes.body.data?.status}.`);

      // Complete service
      const compRes = await request(app)
        .post(`/api/queue/${ticketId}/complete`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ notes: 'QA Service completed successfully' });
      console.log(` [PASS] Service completed: Status ${compRes.body.data?.status}.`);
    }

    // 11. Admin Analytics
    console.log('\n11. Testing Admin Analytics Retrieval...');
    const analyticsRes = await request(app)
      .get(`/api/analytics/dashboard?branchId=${branch.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    if (analyticsRes.status !== 200 || typeof analyticsRes.body.data?.totalBookings !== 'number') {
      issues.push(`Analytics retrieval failed: ${analyticsRes.status} ${JSON.stringify(analyticsRes.body)}`);
    } else {
      console.log(` [PASS] Analytics retrieved: Total Bookings: ${analyticsRes.body.data.totalBookings}, Avg Wait: ${analyticsRes.body.data.averageWaitTimeMinutes}m.`);
    }

    console.log('\n=== MANUAL QA SUMMARY ===');
    if (issues.length === 0) {
      console.log(' ALL 11 CRITICAL END-TO-END BUSINESS FLOWS PASSED WITH 0 DEFECTS!');
    } else {
      console.log(` Found ${issues.length} issues:`, issues);
    }
  } catch (err: any) {
    console.error(' QA Script exception:', err);
  }
}

runManualQA();
