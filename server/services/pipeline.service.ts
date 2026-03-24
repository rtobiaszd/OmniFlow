import { PipelineRepository } from "../repositories/pipeline.repository";
import { Pipeline } from "../../src/types";
import { IPipelineService } from "../interfaces/service.interface";

export class PipelineService implements IPipelineService {
  private pipelineRepo = new PipelineRepository();

  async getAllPipelines(): Promise<Pipeline[]> {
    return this.pipelineRepo.findAll();
  }

  async getPipelineById(id: string): Promise<Pipeline | undefined> {
    return this.pipelineRepo.findById(id);
  }

  async createPipeline(name: string, tenantId: string = 't_unknown'): Promise<Pipeline> {
    return this.pipelineRepo.create({
      id: `p${Date.now()}`,
      name,
      stages: [],
      customFields: [],
      tenantId
    } as Pipeline);
  }

  async updatePipeline(id: string, data: Partial<Pipeline>): Promise<Pipeline | undefined> {
    return this.pipelineRepo.update(id, data);
  }
}
