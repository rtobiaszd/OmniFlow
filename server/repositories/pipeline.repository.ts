import prisma from "../lib/prisma";
import { Pipeline } from "../../src/types";
import { IPipelineRepository } from "../interfaces/repository.interface";

export class PipelineRepository implements IPipelineRepository {
  async findAll(): Promise<Pipeline[]> {
    return (await prisma.pipeline.findMany()) as any;
  }

  async findById(id: string): Promise<Pipeline | undefined> {
    return (await prisma.pipeline.findUnique({ where: { id } })) as any;
  }

  async create(pipeline: Pipeline): Promise<Pipeline> {
    return (await prisma.pipeline.create({ data: pipeline as any })) as any;
  }

  async update(id: string, data: Partial<Pipeline>): Promise<Pipeline | undefined> {
    return (await prisma.pipeline.update({
      where: { id },
      data: data as any
    })) as any;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.pipeline.delete({ where: { id } });
    return true;
  }
}
