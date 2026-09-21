import { resourceRepo, branchRepo } from '../repositories';

export class ResourceService {
  async getResources(branchId?: string) {
    return resourceRepo.findByBranch(branchId);
  }

  async getResourceById(id: string) {
    const resource = await resourceRepo.findById(id);
    if (!resource) {
      const error: any = new Error('Resource not found');
      error.statusCode = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }
    return resource;
  }

  async createResource(data: any) {
    const branch = await branchRepo.findById(data.branchId);
    if (!branch) {
      const error: any = new Error('Associated branch does not exist');
      error.statusCode = 404;
      error.code = 'BRANCH_NOT_FOUND';
      throw error;
    }
    return resourceRepo.create(data);
  }

  async updateResource(id: string, data: any) {
    const updated = await resourceRepo.update(id, data);
    if (!updated) {
      const error: any = new Error('Resource not found');
      error.statusCode = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }
    return updated;
  }

  async deleteResource(id: string) {
    await resourceRepo.delete(id);
    return { message: 'Resource deactivated successfully' };
  }
}

export const resourceService = new ResourceService();
