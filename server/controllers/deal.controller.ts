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
      const result = await this.dealService.createDeal(req.body);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to create deal");
    }
  }

  async update(req: Request, res: Response) {
    try {
      const result = await this.dealService.updateDeal(req.params.id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to update deal");
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.dealService.deleteDeal(req.params.id);
      sendSuccess(res, true);
    } catch (error) {
      sendError(res, "Failed to delete deal");
    }
  }
}
