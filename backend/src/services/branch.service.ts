import { branchRepo } from '../repositories';

export class BranchService {
  async getAllBranches(includeInactive = false) {
    return branchRepo.findAll(includeInactive);
  }

  async getBranchById(id: string) {
    const branch = await branchRepo.findById(id);
    if (!branch) {
      const error: any = new Error('Branch not found');
      error.statusCode = 404;
      error.code = 'BRANCH_NOT_FOUND';
      throw error;
    }
    return branch;
  }

  async createBranch(data: any) {
    return branchRepo.create(data);
  }

  async updateBranch(id: string, data: any) {
    const updated = await branchRepo.update(id, data);
    if (!updated) {
      const error: any = new Error('Branch not found');
      error.statusCode = 404;
      error.code = 'BRANCH_NOT_FOUND';
      throw error;
    }
    return updated;
  }

  async deleteBranch(id: string) {
    await branchRepo.delete(id);
    return { message: 'Branch deactivated successfully' };
  }

  async setWorkingHours(branchId: string, hours: any[]) {
    await this.getBranchById(branchId);
    return branchRepo.setWorkingHours(branchId, hours);
  }

  async addHoliday(branchId: string, data: { date: string; reason: string }) {
    await this.getBranchById(branchId);
    return branchRepo.addHoliday(branchId, data);
  }
}

export const branchService = new BranchService();
