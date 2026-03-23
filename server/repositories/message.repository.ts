import { db } from "../db";
import { Message } from "../../src/types";
import { IMessageRepository } from "../interfaces/repository.interface";

export class MessageRepository implements IMessageRepository {
  async findAll(): Promise<Message[]> {
    return db.messages;
  }

  async create(message: Message): Promise<Message> {
    db.messages.push(message);
    return message;
  }
}
