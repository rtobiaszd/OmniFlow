import { Request, Response } from "express";
import { DealService } from "../services/deal.service";
import { sendSuccess, sendError } from "../utils/response";

export class DealController {
  private dealService = new DealService();

  async getAll(req: Request, res: Response) {
    try {
      const data = await this.dealService.getAllDeals();
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, "Failed to fetch deals");
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await this.dealService.createDeal(req.body);
      sendSuccess(res, data, 201);
    } catch (error) {
      sendError(res, "Failed to create deal");
    }
  }
}
