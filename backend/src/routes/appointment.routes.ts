import { Router } from 'express';
import { z } from 'zod';
import { appointmentController } from '../controllers/appointment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idempotency } from '../middlewares/idempotency.middleware';

const router = Router();

const bookSchema = z.object({
  branchId: z.string().min(1),
  serviceId: z.string().min(1),
  startTime: z.string().datetime(),
  notes: z.string().optional(),
  reservationId: z.string().optional(),
  customerId: z.string().optional(),
});

const rescheduleSchema = z.object({
  newStartTime: z.string().datetime(),
  reason: z.string().optional(),
});

const cancelSchema = z.object({
  reason: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  reason: z.string().optional(),
});

router.post(
  '/',
  authenticate,
  idempotency,
  validate({ body: bookSchema }),
  appointmentController.book
);

router.get('/', authenticate, appointmentController.getAll);
router.get('/:id', authenticate, appointmentController.getById);

router.post(
  '/:id/cancel',
  authenticate,
  validate({ body: cancelSchema }),
  appointmentController.cancel
);

router.post(
  '/:id/reschedule',
  authenticate,
  validate({ body: rescheduleSchema }),
  appointmentController.reschedule
);

// Staff and Admin can directly transition appointment statuses
router.patch(
  '/:id/status',
  authenticate,
  authorize(['STAFF', 'ADMIN']),
  validate({ body: statusSchema }),
  appointmentController.updateStatus
);

export default router;
