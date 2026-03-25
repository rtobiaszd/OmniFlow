import { IntegrationRepository } from "../repositories/integration.repository";
import { Integration } from "../../src/types";
import { IIntegrationService } from "../interfaces/service.interface";

export class IntegrationService implements IIntegrationService {
  private integrationRepo = new IntegrationRepository();

  async getAllIntegrations(): Promise<Integration[]> {
    return this.integrationRepo.findAll();
  }

  async createIntegration(integration: Integration): Promise<Integration> {
    return this.integrationRepo.create(integration);
  }

  async updateIntegration(id: string, data: Partial<Integration>): Promise<Integration | undefined> {
    return this.integrationRepo.update(id, data);
  }

  async deleteIntegration(id: string): Promise<boolean> {
    return this.integrationRepo.delete(id);
  }
}
