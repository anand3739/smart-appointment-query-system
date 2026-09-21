import request from 'supertest';
import { app } from '../src/app';

describe('Idempotency Suite', () => {
  let customerToken: string;
  let branchId: string;
  let serviceId: string;
  const bookingDate = '2026-11-25';

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = loginRes.body.data.token;

    const branchesRes = await request(app).get('/api/branches');
    branchId = branchesRes.body.data[0].id;

    const servicesRes = await request(app).get('/api/services');
    serviceId = servicesRes.body.data[0].id;
  });

  it('should return identical appointment response when sending the same Idempotency-Key', async () => {
    const idempotencyKey = `idem-${Date.now()}-abc`;
    const slotStartTime = `${bookingDate}T09:30:00.000Z`;

    // 1. First submission
    const res1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        branchId,
        serviceId,
        startTime: slotStartTime,
        notes: 'Idempotency test call',
      });

    expect(res1.status).toBe(201);
    const firstAppointmentId = res1.body.data.id;
    const firstAppointmentNumber = res1.body.data.appointmentNumber;

    // 2. Duplicate submission with identical Idempotency-Key
    const res2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        branchId,
        serviceId,
        startTime: slotStartTime,
        notes: 'Idempotency test call',
      });

    // Should return cached success and exact same appointment without duplicating
    expect(res2.status).toBe(201);
    expect(res2.body.data.id).toBe(firstAppointmentId);
    expect(res2.body.data.appointmentNumber).toBe(firstAppointmentNumber);
  });
});
