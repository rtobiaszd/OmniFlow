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
      const result = await this.pipelineService.createPipeline(req.body);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to create pipeline");
    }
  }

  async update(req: Request, res: Response) {
    try {
      const result = await this.pipelineService.updatePipeline(req.params.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to update pipeline");
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.pipelineService.deletePipeline(req.params.id);
      sendSuccess(res, true);
    } catch (error) {
      sendError(res, "Failed to delete pipeline");
    }
  }
}
