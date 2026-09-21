import request from 'supertest';
import { app } from '../src/app';

describe('Concurrency Protection Suite', () => {
  let customer1Token: string;
  let customer2Token: string;
  let branchId: string;
  let singleCapacityServiceId: string;
  const bookingDate = '2026-11-20';

  beforeAll(async () => {
    // Authenticate two distinct customers
    const login1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customer1Token = login1.body.data.token;

    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer2@example.com', password: 'Password123!' });
    customer2Token = login2.body.data.token;

    // Fetch branch
    const branchesRes = await request(app).get('/api/branches');
    branchId = branchesRes.body.data[0].id;

    // Find a service with capacity = 1 (e.g. Priority Express or Comprehensive Diagnostic)
    const servicesRes = await request(app).get('/api/services');
    const serviceWithCapacity1 = servicesRes.body.data.find((s: any) => s.capacityPerSlot === 1);
    singleCapacityServiceId = serviceWithCapacity1.id;
  });

  it('should prevent double booking when two requests race for a single slot', async () => {
    const slotStartTime = `${bookingDate}T10:00:00.000Z`;

    // Fire both booking requests concurrently in parallel
    const [responseA, responseB] = await Promise.all([
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          branchId,
          serviceId: singleCapacityServiceId,
          startTime: slotStartTime,
          notes: 'Racer A',
        }),
      request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          branchId,
          serviceId: singleCapacityServiceId,
          startTime: slotStartTime,
          notes: 'Racer B',
        }),
    ]);

    const statuses = [responseA.status, responseB.status];

    // Exactly one request MUST succeed (201) and the other MUST be rejected (409)
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    const successfulResponse = responseA.status === 201 ? responseA : responseB;
    const rejectedResponse = responseA.status === 409 ? responseA : responseB;

    expect(successfulResponse.body.success).toBe(true);
    expect(successfulResponse.body.data.appointmentNumber).toBeDefined();

    expect(rejectedResponse.body.success).toBe(false);
    expect(rejectedResponse.body.error.code).toBe('SLOT_UNAVAILABLE');
  });
});
