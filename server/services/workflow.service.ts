import { WorkflowRepository } from "../repositories/workflow.repository";
import { DealRepository } from "../repositories/deal.repository";
import { Workflow, Deal } from "../../src/types";
import { IWorkflowService } from "../interfaces/service.interface";

export class WorkflowService implements IWorkflowService {
  private workflowRepo = new WorkflowRepository();
  private dealRepo = new DealRepository();

  async getAllWorkflows(): Promise<Workflow[]> {
    return this.workflowRepo.findAll();
  }

  async processEvent(type: string, payload: any): Promise<void> {
    const workflows = await this.workflowRepo.findActiveByTrigger(type);
    
    for (const workflow of workflows) {
      console.log(`Service: Executing Workflow ${workflow.name}`);
      for (const node of workflow.nodes) {
        if (node.type === 'action' && node.data.action === 'create_deal') {
          await this.createDealFromWorkflow(node.data, payload);
        }
      }
    }
  }

  private async createDealFromWorkflow(nodeData: any, payload: any) {
    const newDeal: Deal = {
      id: `d${Date.now()}`,
      title: `Auto: ${payload.sender || 'New Lead'}`,
      company: payload.company || 'Unknown',
      value: 0,
      stageId: nodeData.stageId,
      pipelineId: nodeData.pipelineId,
      priority: 'medium',
      status: 'open',
      customValues: {},
      assignedTo: 'Workflow Engine',
      createdAt: new Date().toISOString(),
      contactId: payload.contactId || 'c_auto',
      tenantId: payload.tenantId || 't_unknown'
    };
    await this.dealRepo.create(newDeal);
  }
}
