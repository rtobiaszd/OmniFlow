import { Pipeline, Deal, Workflow, Integration, Message } from "../../src/types";

export interface IPipelineService {
  getAllPipelines(): Promise<Pipeline[]>;
  getPipelineById(id: string): Promise<Pipeline | undefined>;
  createPipeline(name: string): Promise<Pipeline>;
  updatePipeline(id: string, data: Partial<Pipeline>): Promise<Pipeline | undefined>;
}

export interface IDealService {
  getAllDeals(): Promise<Deal[]>;
  createDeal(dealData: Partial<Deal>): Promise<Deal>;
  updateDeal(id: string, data: Partial<Deal>): Promise<Deal | undefined>;
}

export interface IWorkflowService {
  getAllWorkflows(): Promise<Workflow[]>;
  processEvent(type: string, payload: any): Promise<void>;
}

export interface IIntegrationService {
  getAllIntegrations(): Promise<Integration[]>;
}

export interface IStatsService {
  getDashboardStats(): Promise<any>;
}
