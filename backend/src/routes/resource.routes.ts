import { Router } from 'express';
import { z } from 'zod';
import { resourceController } from '../controllers/resource.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const resourceSchema = z.object({
  branchId: z.string().min(1),
  name: z.string().min(2),
  type: z.string().min(2),
  isActive: z.boolean().optional(),
});

router.get('/', resourceController.getAll);
router.get('/:id', resourceController.getById);

// Admin only
router.post('/', authenticate, authorize(['ADMIN']), validate({ body: resourceSchema }), resourceController.create);
router.put('/:id', authenticate, authorize(['ADMIN']), resourceController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), resourceController.delete);

export default router;
