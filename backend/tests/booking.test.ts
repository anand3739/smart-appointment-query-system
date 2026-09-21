import request from 'supertest';
import { app } from '../src/app';

describe('Availability & Booking Suite', () => {
  let customerToken: string;
  let branchId: string;
  let serviceId: string;
  const bookingDate = '2026-10-15'; // A future Thursday

  beforeAll(async () => {
    // Login customer
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = loginRes.body.data.token;

    // Get branches and services
    const branchesRes = await request(app).get('/api/branches');
    branchId = branchesRes.body.data[0].id;

    const servicesRes = await request(app).get('/api/services');
    serviceId = servicesRes.body.data[0].id;
  });

  it('should return available slots for a future working day', async () => {
    const res = await request(app)
      .get('/api/availability')
      .query({ branchId, serviceId, date: bookingDate });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.availableSlots).toBeDefined();
    expect(Array.isArray(res.body.data.availableSlots)).toBe(true);
    expect(res.body.data.availableSlots.length).toBeGreaterThan(0);
    expect(res.body.data.availableSlots).toContain('09:00');
    // Break 13:00 to 14:00 should not be in slots
    expect(res.body.data.availableSlots).not.toContain('13:00');
    expect(res.body.data.availableSlots).not.toContain('13:30');
  });

  it('should create a temporary slot reservation with countdown TTL', async () => {
    const slotTime = '11:00';
    const slotStartTime = `${bookingDate}T${slotTime}:00.000Z`;

    const res = await request(app)
      .post('/api/availability/reserve')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        branchId,
        serviceId,
        slotStartTime,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reservationId).toBeDefined();
    expect(res.body.data.expiresAt).toBeDefined();
  });

  it('should successfully book an appointment', async () => {
    const slotStartTime = `${bookingDate}T10:00:00.000Z`;

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        branchId,
        serviceId,
        startTime: slotStartTime,
        notes: 'Integration test consultation booking',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointmentNumber).toMatch(/^APT-\d{4}-\d{6}$/);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('should cancel an appointment and update status', async () => {
    const slotStartTime = `${bookingDate}T11:30:00.000Z`;

    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        branchId,
        serviceId,
        startTime: slotStartTime,
      });

    const appointmentId = bookRes.body.data.id;

    const cancelRes = await request(app)
      .post(`/api/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Schedule conflict' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe('CANCELLED');
  });

  it('should reschedule an appointment to a new available slot', async () => {
    const originalTime = `${bookingDate}T14:30:00.000Z`;
    const newTime = `${bookingDate}T15:30:00.000Z`;

    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        branchId,
        serviceId,
        startTime: originalTime,
      });

    const appointmentId = bookRes.body.data.id;

    const rescheduleRes = await request(app)
      .post(`/api/appointments/${appointmentId}/reschedule`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        newStartTime: newTime,
        reason: 'Requested later time',
      });

    expect(rescheduleRes.status).toBe(200);
    expect(rescheduleRes.body.success).toBe(true);
    expect(rescheduleRes.body.data.status).toBe('CONFIRMED');
    expect(new Date(rescheduleRes.body.data.startTime).toISOString()).toBe(new Date(newTime).toISOString());
  });
});
