import { DealRepository } from "../repositories/deal.repository";
import { Deal } from "../../src/types";
import { IDealService } from "../interfaces/service.interface";

export class DealService implements IDealService {
  private dealRepo = new DealRepository();

  async getAllDeals(): Promise<Deal[]> {
    return this.dealRepo.findAll();
  }

  async createDeal(dealData: Partial<Deal>): Promise<Deal> {
    const newDeal: Deal = {
      id: `d${Date.now()}`,
      title: dealData.title || 'Untitled Deal',
      company: dealData.company || 'Unknown',
      value: dealData.value || 0,
      stageId: dealData.stageId || '',
      pipelineId: dealData.pipelineId || '',
      priority: dealData.priority || 'medium',
      status: dealData.status || 'open',
      customValues: dealData.customValues || {},
      assignedTo: dealData.assignedTo || 'Unassigned',
      createdAt: new Date().toISOString(),
      contactId: dealData.contactId || 'c_unknown',
      tenantId: dealData.tenantId || 't_unknown'
    } as Deal;
    return this.dealRepo.create(newDeal);
  }

  async updateDeal(id: string, data: Partial<Deal>): Promise<Deal | undefined> {
    return this.dealRepo.update(id, data);
  }

  async deleteDeal(id: string): Promise<boolean> {
    return this.dealRepo.delete(id);
  }
}
