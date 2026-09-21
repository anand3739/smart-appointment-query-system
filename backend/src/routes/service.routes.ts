import { Router } from 'express';
import { z } from 'zod';
import { serviceController } from '../controllers/service.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  durationMinutes: z.number().int().positive(),
  price: z.number().nonnegative(),
  capacityPerSlot: z.number().int().positive().default(1),
  isActive: z.boolean().optional(),
  requiredResourceType: z.string().optional(),
});

router.get('/', serviceController.getAll);
router.get('/:id', serviceController.getById);

// Admin only
router.post('/', authenticate, authorize(['ADMIN']), validate({ body: serviceSchema }), serviceController.create);
router.put('/:id', authenticate, authorize(['ADMIN']), serviceController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), serviceController.delete);

export default router;
