import { Request, Response, NextFunction } from 'express';
import { branchService } from '../services/branch.service';
import { sendSuccess } from '../utils/apiResponse';

export class BranchController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const branches = await branchService.getAllBranches(includeInactive);
      return sendSuccess(res, branches);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await branchService.getBranchById(req.params.id as string);
      return sendSuccess(res, branch);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await branchService.createBranch(req.body);
      return sendSuccess(res, branch, 'Branch created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await branchService.updateBranch(req.params.id as string, req.body);
      return sendSuccess(res, branch, 'Branch updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await branchService.deleteBranch(req.params.id as string);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async setWorkingHours(req: Request, res: Response, next: NextFunction) {
    try {
      const hours = await branchService.setWorkingHours(req.params.id as string, req.body.hours);
      return sendSuccess(res, hours, 'Working hours updated');
    } catch (err) {
      next(err);
    }
  }

  async addHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const holiday = await branchService.addHoliday(req.params.id as string, req.body);
      return sendSuccess(res, holiday, 'Holiday added', 201);
    } catch (err) {
      next(err);
    }
  }
}

export const branchController = new BranchController();
