import prisma from "../lib/prisma";
import { Integration } from "../../src/types";

export class IntegrationRepository {
  async findAll(): Promise<Integration[]> {
    return (await prisma.integration.findMany()) as any;
  }

  async findById(id: string): Promise<Integration | undefined> {
    return (await prisma.integration.findUnique({ where: { id } })) as any;
  }

  async create(integration: Integration): Promise<Integration> {
    return (await prisma.integration.create({ data: integration as any })) as any;
  }

  async update(id: string, data: Partial<Integration>): Promise<Integration | undefined> {
    return (await prisma.integration.update({
      where: { id },
      data: data as any
    })) as any;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.integration.delete({ where: { id } });
    return true;
  }
}
