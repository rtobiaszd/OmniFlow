import { Request, Response } from "express";
import { IntegrationService } from "../services/integration.service";
import { sendSuccess, sendError } from "../utils/response";

export class IntegrationController {
  private integrationService = new IntegrationService();

  async getAll(req: Request, res: Response) {
    try {
      const data = await this.integrationService.getAllIntegrations();
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, "Failed to fetch integrations");
    }
  }
}
