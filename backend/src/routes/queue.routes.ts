import { Router } from 'express';
import { z } from 'zod';
import { queueController } from '../controllers/queue.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const walkinSchema = z.object({
  branchId: z.string().min(1),
  serviceId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().optional(),
  priority: z.enum(['NORMAL', 'PRIORITY', 'EMERGENCY']).default('NORMAL'),
  notes: z.string().optional(),
});

const checkinSchema = z.object({
  appointmentId: z.string().min(1),
});

// Customer & Public
router.get('/live', queueController.getLiveQueue);
router.get('/my-position', authenticate, queueController.getMyPosition);

// Staff and Admin operations
router.post(
  '/walkin',
  authenticate,
  authorize(['STAFF', 'ADMIN']),
  validate({ body: walkinSchema }),
  queueController.addWalkin
);

router.post(
  '/checkin',
  authenticate,
  authorize(['STAFF', 'ADMIN']),
  validate({ body: checkinSchema }),
  queueController.checkin
);

router.post(
  '/call-next',
  authenticate,
  authorize(['STAFF', 'ADMIN']),
  queueController.callNext
);

router.post(
  '/:id/start-service',
  authenticate,
  authorize(['STAFF', 'ADMIN']),
  queueController.startService
);

router.post(
  '/:id/complete',
  authenticate,
  authorize(['STAFF', 'ADMIN']),
  queueController.completeService
);

router.post(
  '/:id/skip',
  authenticate,
  authorize(['STAFF', 'ADMIN']),
  queueController.skipCustomer
);

router.delete(
  '/:id',
  authenticate,
  authorize(['STAFF', 'ADMIN']),
  queueController.removeEntry
);

export default router;
