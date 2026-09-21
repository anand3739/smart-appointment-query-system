import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

const router = Router();

// Admin and Staff can view analytics
router.get(
  '/dashboard',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  analyticsController.getDashboard
);

export default router;
