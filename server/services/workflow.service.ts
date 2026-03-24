import { WorkflowRepository } from "../repositories/workflow.repository";
import { DealRepository } from "../repositories/deal.repository";
import { Workflow, Deal } from "../../src/types";
import { IWorkflowService } from "../interfaces/service.interface";
import { MailService } from "./mail.service";
import { IntegrationRepository } from "../repositories/integration.repository";

export class WorkflowService implements IWorkflowService {
  private workflowRepo = new WorkflowRepository();
  private dealRepo = new DealRepository();
  private integrationRepo = new IntegrationRepository();

  async getAllWorkflows(): Promise<Workflow[]> {
    return this.workflowRepo.findAll();
  }

  async processEvent(type: string, payload: any): Promise<void> {
    const workflows = await this.workflowRepo.findActiveByTrigger(type);
    
    // Find email integration for this tenant if needed
    const integrations = await this.integrationRepo.findAll();
    const emailInt = integrations.find(i => i.tenantId === payload.tenantId && i.provider === 'email' && i.status === 'connected');

    for (const workflow of workflows) {
      console.log(`Service: Executing Workflow ${workflow.name}`);
      for (const node of workflow.nodes) {
        if (node.type === 'action' && node.data.action === 'create_deal') {
          await this.createDealFromWorkflow(node.data, payload);
        } else if (node.type === 'email_action' && emailInt) {
          const to = node.data.to.replace('{{sender}}', payload.senderEmail || '');
          const subject = node.data.subject.replace('{{subject}}', payload.subject || '');
          const body = node.data.body || '';
          
          await MailService.sendEmail(emailInt, to, subject, body);
          console.log(`Service: Email sent to ${to}`);
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
      contactId: payload.contactId || 'c_auto'
    };
    await this.dealRepo.create(newDeal);
  }
}
