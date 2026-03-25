import { Request, Response } from "express";
import { IntegrationService } from "../services/integration.service";
import { sendSuccess, sendError } from "../utils/response";

export class IntegrationController {
  private integrationService = new IntegrationService();

  async getAll(req: Request, res: Response) {
    try {
      const { tenantId } = req.query;
      const data = await this.integrationService.getAllIntegrations();
      // Filter by tenant if provided
      const filtered = tenantId ? data.filter(i => i.tenantId === tenantId) : data;
      sendSuccess(res, filtered);
    } catch (error) {
      sendError(res, "Failed to fetch integrations");
    }
  }

  async create(req: Request, res: Response) {
    try {
      const integration = req.body;
      const result = await this.integrationService.createIntegration(integration);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to create integration");
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await this.integrationService.updateIntegration(id, data);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to update integration");
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.integrationService.deleteIntegration(id);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to delete integration");
    }
  }
}
