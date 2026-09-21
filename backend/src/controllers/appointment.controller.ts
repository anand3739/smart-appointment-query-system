import { Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AppointmentController {
  async book(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.role === 'CUSTOMER' ? req.user!.userId : req.body.customerId || req.user!.userId;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const appointment = await bookingService.bookAppointment({
        ...req.body,
        customerId,
        idempotencyKey,
      });

      return sendSuccess(res, appointment, 'Appointment booked successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filter: any = {};
      if (req.user!.role === 'CUSTOMER') {
        filter.customerId = req.user!.userId;
      } else {
        if (req.query.branchId) filter.branchId = req.query.branchId as string;
        if (req.query.customerId) filter.customerId = req.query.customerId as string;
      }
      if (req.query.date) filter.date = req.query.date as string;
      if (req.query.status) filter.status = req.query.status as string;

      const appointments = await bookingService.getAppointments(filter);
      return sendSuccess(res, appointments);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const appointment = await bookingService.getAppointmentById(req.params.id as string);
      return sendSuccess(res, appointment);
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const appointment = await bookingService.cancelAppointment(
        req.params.id as string,
        req.user!.userId,
        req.body.reason
      );
      return sendSuccess(res, appointment, 'Appointment cancelled successfully');
    } catch (err) {
      next(err);
    }
  }

  async reschedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const appointment = await bookingService.rescheduleAppointment(
        req.params.id as string,
        req.user!.userId,
        req.body.newStartTime,
        req.body.reason
      );
      return sendSuccess(res, appointment, 'Appointment rescheduled successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const appointment = await bookingService.updateAppointmentStatus(
        req.params.id as string,
        req.body.status,
        req.body.reason,
        req.user!.userId
      );
      return sendSuccess(res, appointment, 'Appointment status updated');
    } catch (err) {
      next(err);
    }
  }
}

export const appointmentController = new AppointmentController();
