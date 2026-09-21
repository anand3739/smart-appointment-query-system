import { Request, Response, NextFunction } from 'express';
import { resourceService } from '../services/resource.service';
import { sendSuccess } from '../utils/apiResponse';

export class ResourceController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.query.branchId as string;
      const resources = await resourceService.getResources(branchId);
      return sendSuccess(res, resources);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const resource = await resourceService.getResourceById(req.params.id as string);
      return sendSuccess(res, resource);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const resource = await resourceService.createResource(req.body);
      return sendSuccess(res, resource, 'Resource created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const resource = await resourceService.updateResource(req.params.id as string, req.body);
      return sendSuccess(res, resource, 'Resource updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resourceService.deleteResource(req.params.id as string);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const resourceController = new ResourceController();
