import { db } from "../db";
import { Integration } from "../../src/types";
import { IIntegrationRepository } from "../interfaces/repository.interface";

export class IntegrationRepository implements IIntegrationRepository {
  async findAll(): Promise<Integration[]> {
    return db.integrations;
  }

  async findById(id: string): Promise<Integration | undefined> {
    return db.integrations.find(i => i.id === id);
  }
}
