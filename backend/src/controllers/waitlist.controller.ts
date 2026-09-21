import { Response, NextFunction } from 'express';
import { waitlistService } from '../services/waitlist.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middlewares/auth.middleware';

export class WaitlistController {
  async join(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const entry = await waitlistService.joinWaitlist({
        ...req.body,
        customerId: req.user!.userId,
      });
      return sendSuccess(res, entry, 'Joined waiting list successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getMyEntries(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const entries = await waitlistService.getMyWaitlist(req.user!.userId);
      return sendSuccess(res, entries);
    } catch (err) {
      next(err);
    }
  }

  async acceptOffer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await waitlistService.acceptOffer(req.params.id as string, req.user!.userId);
      return sendSuccess(res, result, 'Slot offer accepted');
    } catch (err) {
      next(err);
    }
  }

  async leave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await waitlistService.leaveWaitlist(req.params.id as string);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const waitlistController = new WaitlistController();
