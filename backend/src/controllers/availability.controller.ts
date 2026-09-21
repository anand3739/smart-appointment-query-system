import { Request, Response, NextFunction } from 'express';
import { availabilityService } from '../services/availability.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AvailabilityController {
  async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId, serviceId, date } = req.query as {
        branchId: string;
        serviceId: string;
        date: string;
      };
      const result = await availabilityService.getAvailability(branchId, serviceId, date);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async reserveSlot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { branchId, serviceId, slotStartTime } = req.body;
      const userId = req.user?.userId || 'anonymous';
      const result = await availabilityService.reserveTemporarySlot(
        branchId,
        serviceId,
        slotStartTime,
        userId
      );
      return sendSuccess(res, result, 'Temporary slot hold created', 201);
    } catch (err) {
      next(err);
    }
  }

  async releaseReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await availabilityService.releaseReservation(req.params.id as string);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const availabilityController = new AvailabilityController();
