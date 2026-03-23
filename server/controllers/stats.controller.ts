import { Request, Response } from "express";
import { StatsService } from "../services/stats.service";
import { sendSuccess, sendError } from "../utils/response";

export class StatsController {
  private statsService = new StatsService();

  async getDashboardStats(req: Request, res: Response) {
    try {
      const data = await this.statsService.getDashboardStats();
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, "Failed to fetch stats");
    }
  }
}
