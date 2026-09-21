import { Request, Response, NextFunction } from 'express';
import { queueService } from '../services/queue.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middlewares/auth.middleware';

export class QueueController {
  async addWalkin(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await queueService.addWalkin(req.body);
      return sendSuccess(res, entry, 'Walk-in customer added to queue', 201);
    } catch (err) {
      next(err);
    }
  }

  async checkin(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await queueService.checkinAppointment(req.body.appointmentId);
      return sendSuccess(res, entry, 'Customer checked in to queue');
    } catch (err) {
      next(err);
    }
  }

  async getLiveQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.query.branchId as string;
      const queue = await queueService.getLiveQueue(branchId);
      return sendSuccess(res, queue);
    } catch (err) {
      next(err);
    }
  }

  async getMyPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const positionData = await queueService.getMyPosition(req.user!.userId);
      return sendSuccess(res, positionData);
    } catch (err) {
      next(err);
    }
  }

  async callNext(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId, resourceId } = req.body;
      const nextCustomer = await queueService.callNext(branchId, resourceId);
      return sendSuccess(res, nextCustomer, nextCustomer ? 'Next customer called' : 'No customers waiting in queue');
    } catch (err) {
      next(err);
    }
  }

  async startService(req: Request, res: Response, next: NextFunction) {
    try {
      const { resourceId } = req.body;
      const entry = await queueService.startService(req.params.id as string, resourceId);
      return sendSuccess(res, entry, 'Service started');
    } catch (err) {
      next(err);
    }
  }

  async completeService(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await queueService.completeService(req.params.id as string);
      return sendSuccess(res, entry, 'Service completed');
    } catch (err) {
      next(err);
    }
  }

  async skipCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await queueService.skipCustomer(req.params.id as string);
      return sendSuccess(res, entry, 'Customer skipped');
    } catch (err) {
      next(err);
    }
  }

  async removeEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await queueService.removeQueueEntry(req.params.id as string);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const queueController = new QueueController();
