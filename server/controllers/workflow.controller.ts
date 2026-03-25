import { Request, Response } from "express";
import { WorkflowService } from "../services/workflow.service";
import { sendSuccess, sendError } from "../utils/response";

export class WorkflowController {
  private workflowService = new WorkflowService();

  async getAll(req: Request, res: Response) {
    try {
      const data = await this.workflowService.getAllWorkflows();
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, "Failed to fetch workflows");
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const result = await this.workflowService.createWorkflow(data.tenantId, data.name, data.description);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to create workflow");
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      // In Prisma we just update the whole object or partial
      const result = await this.workflowService.updateWorkflow(data);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to update workflow");
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.workflowService.deleteWorkflow(id);
      sendSuccess(res, true);
    } catch (error) {
      sendError(res, "Failed to delete workflow");
    }
  }
}
