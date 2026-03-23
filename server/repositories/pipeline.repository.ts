import { db } from "../db";
import { Pipeline } from "../../src/types";
import { IPipelineRepository } from "../interfaces/repository.interface";

export class PipelineRepository implements IPipelineRepository {
  async findAll(): Promise<Pipeline[]> {
    return db.pipelines;
  }

  async findById(id: string): Promise<Pipeline | undefined> {
    return db.pipelines.find(p => p.id === id);
  }

  async create(pipeline: Pipeline): Promise<Pipeline> {
    db.pipelines.push(pipeline);
    return pipeline;
  }

  async update(id: string, data: Partial<Pipeline>): Promise<Pipeline | undefined> {
    const index = db.pipelines.findIndex(p => p.id === id);
    if (index !== -1) {
      db.pipelines[index] = { ...db.pipelines[index], ...data };
      return db.pipelines[index];
    }
    return undefined;
  }

  async delete(id: string): Promise<boolean> {
    const index = db.pipelines.findIndex(p => p.id === id);
    if (index !== -1) {
      db.pipelines.splice(index, 1);
      return true;
    }
    return false;
  }
}
