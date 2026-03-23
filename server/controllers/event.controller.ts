import { Request, Response } from "express";
import { WorkflowService } from "../services/workflow.service";
import { sendSuccess, sendError } from "../utils/response";

export class EventController {
  private workflowService = new WorkflowService();

  async handle(req: Request, res: Response) {
    try {
      const { type, payload } = req.body;
      if (!type || !payload) return sendError(res, "Type and payload are required", 400);
      await this.workflowService.processEvent(type, payload);
      sendSuccess(res, { status: "processed" });
    } catch (error) {
      sendError(res, "Failed to process event");
    }
  }
}
