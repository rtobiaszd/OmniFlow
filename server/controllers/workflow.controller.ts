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
}
