import { IntegrationRepository } from "../repositories/integration.repository";
import { Integration } from "../../src/types";
import { IIntegrationService } from "../interfaces/service.interface";

export class IntegrationService implements IIntegrationService {
  private integrationRepo = new IntegrationRepository();

  async getAllIntegrations(): Promise<Integration[]> {
    return this.integrationRepo.findAll();
  }
}
