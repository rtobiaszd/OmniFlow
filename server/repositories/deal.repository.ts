import prisma from "../lib/prisma";
import { Deal } from "../../src/types";
import { IDealRepository } from "../interfaces/repository.interface";

export class DealRepository implements IDealRepository {
  async findAll(): Promise<Deal[]> {
    return (await prisma.deal.findMany()) as any;
  }

  async findById(id: string): Promise<Deal | undefined> {
    return (await prisma.deal.findUnique({ where: { id } })) as any;
  }

  async create(deal: Deal): Promise<Deal> {
    return (await prisma.deal.create({ data: deal as any })) as any;
  }

  async update(id: string, data: Partial<Deal>): Promise<Deal | undefined> {
    return (await prisma.deal.update({
      where: { id },
      data: data as any
    })) as any;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.deal.delete({ where: { id } });
    return true;
  }
}
