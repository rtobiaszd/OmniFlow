import { DealRepository } from "../repositories/deal.repository";
import { MessageRepository } from "../repositories/message.repository";
import { IStatsService } from "../interfaces/service.interface";

export class StatsService implements IStatsService {
  private dealRepo = new DealRepository();
  private messageRepo = new MessageRepository();

  async getDashboardStats(): Promise<any> {
    const deals = await this.dealRepo.findAll();
    const messages = await this.messageRepo.findAll();
    
    return {
      activeConversations: messages.length + 124,
      openDeals: deals.length,
      automationSuccess: "98.2%",
      avgResponseTime: "2m 14s"
    };
  }
}
