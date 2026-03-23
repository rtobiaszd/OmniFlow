import { Request, Response } from "express";
import { PipelineService } from "../services/pipeline.service";
import { sendSuccess, sendError } from "../utils/response";

export class PipelineController {
  private pipelineService = new PipelineService();

  async getAll(req: Request, res: Response) {
    try {
      const data = await this.pipelineService.getAllPipelines();
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, "Failed to fetch pipelines");
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name) return sendError(res, "Pipeline name is required", 400);
      const data = await this.pipelineService.createPipeline(name);
      sendSuccess(res, data, 201);
    } catch (error) {
      sendError(res, "Failed to create pipeline");
    }
  }
}
