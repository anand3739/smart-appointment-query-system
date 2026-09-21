import { Request, Response, NextFunction } from 'express';
import { serviceCatalogService } from '../services/service.service';
import { sendSuccess } from '../utils/apiResponse';

export class ServiceController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const services = await serviceCatalogService.getAllServices(includeInactive);
      return sendSuccess(res, services);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await serviceCatalogService.getServiceById(req.params.id as string);
      return sendSuccess(res, service);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await serviceCatalogService.createService(req.body);
      return sendSuccess(res, service, 'Service created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await serviceCatalogService.updateService(req.params.id as string, req.body);
      return sendSuccess(res, service, 'Service updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serviceCatalogService.deleteService(req.params.id as string);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const serviceController = new ServiceController();
