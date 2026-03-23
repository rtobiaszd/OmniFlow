import { Pipeline, Deal, Workflow, Integration, Message } from "../../src/types";

export interface IPipelineRepository {
  findAll(): Promise<Pipeline[]>;
  findById(id: string): Promise<Pipeline | undefined>;
  create(pipeline: Pipeline): Promise<Pipeline>;
  update(id: string, data: Partial<Pipeline>): Promise<Pipeline | undefined>;
  delete(id: string): Promise<boolean>;
}

export interface IDealRepository {
  findAll(): Promise<Deal[]>;
  findById(id: string): Promise<Deal | undefined>;
  create(deal: Deal): Promise<Deal>;
  update(id: string, data: Partial<Deal>): Promise<Deal | undefined>;
  delete(id: string): Promise<boolean>;
}

export interface IWorkflowRepository {
  findAll(): Promise<Workflow[]>;
  findById(id: string): Promise<Workflow | undefined>;
  findActiveByTrigger(event: string): Promise<Workflow[]>;
  create(workflow: Workflow): Promise<Workflow>;
  update(id: string, data: Partial<Workflow>): Promise<Workflow | undefined>;
  delete(id: string): Promise<boolean>;
}

export interface IIntegrationRepository {
  findAll(): Promise<Integration[]>;
  findById(id: string): Promise<Integration | undefined>;
}

export interface IMessageRepository {
  findAll(): Promise<Message[]>;
  create(message: Message): Promise<Message>;
}
