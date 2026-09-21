import { serviceRepo } from '../repositories';

export class ServiceCatalogService {
  async getAllServices(includeInactive = false) {
    return serviceRepo.findAll(includeInactive);
  }

  async getServiceById(id: string) {
    const service = await serviceRepo.findById(id);
    if (!service) {
      const error: any = new Error('Service not found');
      error.statusCode = 404;
      error.code = 'SERVICE_NOT_FOUND';
      throw error;
    }
    return service;
  }

  async createService(data: any) {
    return serviceRepo.create(data);
  }

  async updateService(id: string, data: any) {
    const updated = await serviceRepo.update(id, data);
    if (!updated) {
      const error: any = new Error('Service not found');
      error.statusCode = 404;
      error.code = 'SERVICE_NOT_FOUND';
      throw error;
    }
    return updated;
  }

  async deleteService(id: string) {
    await serviceRepo.delete(id);
    return { message: 'Service deactivated successfully' };
  }
}

export const serviceCatalogService = new ServiceCatalogService();
