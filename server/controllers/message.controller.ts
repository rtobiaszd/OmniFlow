import { Request, Response } from "express";
import { MessageRepository, ConversationRepository } from "../repositories/message.repository";
import { sendSuccess, sendError } from "../utils/response";

export class MessageController {
  private messageRepo = new MessageRepository();
  private conversationRepo = new ConversationRepository();

  async getConversations(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const data = await this.conversationRepo.findByTenant(tenantId);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, "Failed to fetch conversations");
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const data = await this.messageRepo.findAllByConversation(conversationId);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, "Failed to fetch messages");
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { tenantId, conversationId, content, channel, senderId } = req.body;
      const result = await this.messageRepo.create({
        tenantId,
        conversationId,
        content,
        channel,
        senderId,
        contactId: null // default
      });
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, "Failed to send message");
    }
  }
}
