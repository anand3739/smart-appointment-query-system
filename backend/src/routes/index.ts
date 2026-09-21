import { Router } from 'express';
import authRoutes from './auth.routes';
import branchRoutes from './branch.routes';
import serviceRoutes from './service.routes';
import resourceRoutes from './resource.routes';
import availabilityRoutes from './availability.routes';
import appointmentRoutes from './appointment.routes';
import waitlistRoutes from './waitlist.routes';
import queueRoutes from './queue.routes';
import notificationRoutes from './notification.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/services', serviceRoutes);
router.use('/resources', resourceRoutes);
router.use('/availability', availabilityRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/waitlist', waitlistRoutes);
router.use('/queue', queueRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Smart Appointment & Queue Management API',
  });
});

export default router;
