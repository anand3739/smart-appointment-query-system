import { Router } from 'express';
import { z } from 'zod';
import { availabilityController } from '../controllers/availability.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const querySchema = z.object({
  branchId: z.string().min(1, 'branchId is required'),
  serviceId: z.string().min(1, 'serviceId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
});

const reserveSchema = z.object({
  branchId: z.string().min(1),
  serviceId: z.string().min(1),
  slotStartTime: z.string().datetime(),
});

router.get('/', validate({ query: querySchema }), availabilityController.getAvailability);
router.post('/reserve', authenticate, validate({ body: reserveSchema }), availabilityController.reserveSlot);
router.delete('/reserve/:id', authenticate, availabilityController.releaseReservation);

export default router;
