import { db } from "../db";
import { Deal } from "../../src/types";
import { IDealRepository } from "../interfaces/repository.interface";

export class DealRepository implements IDealRepository {
  async findAll(): Promise<Deal[]> {
    return db.deals;
  }

  async findById(id: string): Promise<Deal | undefined> {
    return db.deals.find(d => d.id === id);
  }

  async create(deal: Deal): Promise<Deal> {
    db.deals.push(deal);
    return deal;
  }

  async update(id: string, data: Partial<Deal>): Promise<Deal | undefined> {
    const index = db.deals.findIndex(d => d.id === id);
    if (index !== -1) {
      db.deals[index] = { ...db.deals[index], ...data };
      return db.deals[index];
    }
    return undefined;
  }

  async delete(id: string): Promise<boolean> {
    const index = db.deals.findIndex(d => d.id === id);
    if (index !== -1) {
      db.deals.splice(index, 1);
      return true;
    }
    return false;
  }
}
