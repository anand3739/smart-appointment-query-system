import { Router } from 'express';
import { z } from 'zod';
import { waitlistController } from '../controllers/waitlist.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const joinSchema = z.object({
  branchId: z.string().min(1),
  serviceId: z.string().min(1),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.post('/', authenticate, validate({ body: joinSchema }), waitlistController.join);
router.get('/', authenticate, waitlistController.getMyEntries);
router.post('/:id/accept', authenticate, waitlistController.acceptOffer);
router.delete('/:id', authenticate, waitlistController.leave);

export default router;
