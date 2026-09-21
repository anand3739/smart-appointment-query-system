import request from 'supertest';
import { app } from '../src/app';

describe('Queue Management & Prioritization Suite', () => {
  let staffToken: string;
  let customerToken: string;
  let branchId: string;
  let serviceId: string;

  beforeAll(async () => {
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@example.com', password: 'Password123!' });
    staffToken = staffLogin.body.data.token;

    const custLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@example.com', password: 'Password123!' });
    customerToken = custLogin.body.data.token;

    const branchesRes = await request(app).get('/api/branches');
    branchId = branchesRes.body.data[0].id;

    const servicesRes = await request(app).get('/api/services');
    serviceId = servicesRes.body.data[0].id;
  });

  it('should add walk-in entries with different priorities and sort deterministically', async () => {
    // 1. Add Normal priority walk-in
    const normalRes = await request(app)
      .post('/api/queue/walkin')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        branchId,
        serviceId,
        customerName: 'Alice Normal',
        priority: 'NORMAL',
      });
    expect(normalRes.status).toBe(201);
    expect(normalRes.body.data.queueNumber).toMatch(/^A-\d{3}$/);

    // 2. Add Emergency priority walk-in (should jump ahead of Normal)
    const emergencyRes = await request(app)
      .post('/api/queue/walkin')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        branchId,
        serviceId,
        customerName: 'Bob Emergency',
        priority: 'EMERGENCY',
      });
    expect(emergencyRes.status).toBe(201);
    expect(emergencyRes.body.data.queueNumber).toMatch(/^E-\d{3}$/);

    // 3. Add Priority walk-in (should sit between Emergency and Normal)
    const priorityRes = await request(app)
      .post('/api/queue/walkin')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        branchId,
        serviceId,
        customerName: 'Charlie Priority',
        priority: 'PRIORITY',
      });
    expect(priorityRes.status).toBe(201);
    expect(priorityRes.body.data.queueNumber).toMatch(/^P-\d{3}$/);

    // 4. Fetch live queue
    const liveRes = await request(app)
      .get('/api/queue/live')
      .query({ branchId });

    expect(liveRes.status).toBe(200);
    const waitingList = liveRes.body.data.filter((q: any) => q.status === 'WAITING');

    // The top waiting entry must be an EMERGENCY entry!
    expect(waitingList[0].priority).toBe('EMERGENCY');
  });

  it('should call next customer, start service, and complete service', async () => {
    // 1. Call next
    const callRes = await request(app)
      .post('/api/queue/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ branchId });

    expect(callRes.status).toBe(200);
    expect(callRes.body.success).toBe(true);

    if (callRes.body.data) {
      const calledId = callRes.body.data.id;
      expect(callRes.body.data.status).toBe('CALLED');

      // 2. Start service
      const startRes = await request(app)
        .post(`/api/queue/${calledId}/start-service`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});

      expect(startRes.status).toBe(200);
      expect(startRes.body.data.status).toBe('SERVING');

      // 3. Complete service
      const completeRes = await request(app)
        .post(`/api/queue/${calledId}/complete`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe('COMPLETED');
    }
  });
});
