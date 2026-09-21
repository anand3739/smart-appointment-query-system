import { Router } from 'express';
import { z } from 'zod';
import { branchController } from '../controllers/branch.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const branchSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(5),
  email: z.string().email(),
  isActive: z.boolean().optional(),
});

router.get('/', branchController.getAll);
router.get('/:id', branchController.getById);

// Admin only
router.post('/', authenticate, authorize(['ADMIN']), validate({ body: branchSchema }), branchController.create);
router.put('/:id', authenticate, authorize(['ADMIN']), branchController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), branchController.delete);
router.post('/:id/working-hours', authenticate, authorize(['ADMIN']), branchController.setWorkingHours);
router.post('/:id/holidays', authenticate, authorize(['ADMIN']), branchController.addHoliday);

export default router;
