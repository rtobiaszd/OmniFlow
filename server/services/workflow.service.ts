import { WorkflowRepository } from "../repositories/workflow.repository";
import { DealRepository } from "../repositories/deal.repository";
import { Workflow, Deal } from "../../src/types";
import { IWorkflowService } from "../interfaces/service.interface";
import { IntegrationRepository } from "../repositories/integration.repository";
import prisma from "../lib/prisma";

export class WorkflowService implements IWorkflowService {
  private workflowRepo = new WorkflowRepository();
  private integrationRepo = new IntegrationRepository();
  private dealRepo = new DealRepository();

  async getAllWorkflows(): Promise<Workflow[]> {
    return this.workflowRepo.findAll();
  }

  async createWorkflow(tenantId: string, name: string, description: string = ''): Promise<Workflow> {
    return this.workflowRepo.create({
      id: `wf_${Date.now()}`,
      tenantId,
      name,
      description,
      active: false,
      nodes: [],
      edges: []
    } as any);
  }

  async updateWorkflow(workflow: Workflow): Promise<Workflow> {
    return this.workflowRepo.update(workflow.id, workflow);
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflowRepo.delete(id);
  }

  async toggleActive(id: string, active: boolean): Promise<Workflow | undefined> {
    return this.workflowRepo.update(id, { active });
  }

  async processEvent(type: string, payload: any): Promise<void> {
    const workflows = await this.workflowRepo.findActiveByTrigger(type);
    
    const integrations = await this.integrationRepo.findAll();
    console.log(`WorkflowEngine: Processing event: "${type}" for tenant: "${payload.tenantId}"`);
    console.log(`WorkflowEngine: Payload:`, JSON.stringify(payload).substring(0, 100));
    const emailInt = integrations.find(i => 
      i.tenantId === payload.tenantId && 
      (i.provider === 'email' || i.provider === 'gmail' || (i.provider as any) === 'Generic') && 
      i.status === 'connected'
    );

    for (const workflow of workflows) {
      const triggerNode = workflow.nodes.find(n => 
        (n.type === 'trigger' && n.data.event === type) ||
        (n.type === 'module_record' && type === 'module_record_created' && n.data.moduleId === payload.moduleId) ||
        (n.type === 'email_trigger' && type === 'email_received')
      );

      if (!triggerNode) {
        console.log(`WorkflowEngine: ⏭️ Skipping workflow "${workflow.name}" (No matching trigger node)`);
        continue;
      }

      // Filter by Sender or Subject if email trigger
      if (triggerNode.type === 'email_trigger') {
        const triggerData = triggerNode.data;
        if (triggerData.sender && !payload.senderEmail?.toLowerCase().includes(triggerData.sender.toLowerCase())) {
          console.log(`WorkflowEngine: ⏭️ Skipping "${workflow.name}" (Sender "${payload.senderEmail}" does not match filter "${triggerData.sender}")`);
          continue;
        }
        if (triggerData.subject && !payload.subject?.toLowerCase().includes(triggerData.subject.toLowerCase())) {
          console.log(`WorkflowEngine: ⏭️ Skipping "${workflow.name}" (Subject "${payload.subject}" does not match filter "${triggerData.subject}")`);
          continue;
        }
      }

      if (triggerNode && type === 'email_received') {
        const senderFilter = triggerNode.data.senderFilter || 
                           triggerNode.data.filterBySender || 
                           triggerNode.data.from || '';
                           
        const subjectKeyword = triggerNode.data.subjectKeyword || 
                             triggerNode.data.keyword || '';
        
        const senderEmail = (payload.senderEmail || '').toLowerCase().trim();
        const subject = (payload.subject || '').toLowerCase().trim();

        console.log(`Service: Checking filters for "${workflow.name}" against "${senderEmail}"/ "${subject}"`);

        // Apply filters
        if (senderFilter && !senderEmail.includes(senderFilter.toLowerCase().trim())) {
          console.log(`Service: ⏭️ Skipping: ${senderEmail} != filter ${senderFilter}`);
          continue;
        }

        if (subjectKeyword && !subject.includes(subjectKeyword.toLowerCase().trim())) {
          console.log(`Service: ⏭️ Skipping: subject mismatch with ${subjectKeyword}`);
          continue;
        }
      }

      console.log(`Service: Executing Workflow ${workflow.name}`);
      for (const node of workflow.nodes) {
        try {
          if (node.type === 'action' && node.data.action === 'create_deal') {
            await this.createDealFromWorkflow(node.data, payload);
          } else if (node.type === 'email_action' && emailInt) {
            const variables: Record<string, string> = {
              'sender': payload.senderEmail || '',
              'sender_name': payload.sender || '',
              'subject': payload.subject || '',
              'body': payload.body || '',
              'received_at': payload.receivedAt || ''
            };

            const replaceVars = (text: string) => {
              let result = text || '';
              Object.entries(variables).forEach(([key, val]) => {
                // Support {{var}}, [var], and {var}
                result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), val);
                result = result.replace(new RegExp(`\\[${key}\\]`, 'gi'), val);
                result = result.replace(new RegExp(`\\{${key}\\}`, 'gi'), val);
                
                // Compatibility for old "sender" vs "sender_email"
                if (key === 'sender') {
                  result = result.replace(/\[sender_email\]/gi, val);
                }
              });
              return result;
            };

            const to = replaceVars(node.data.to || payload.senderEmail || '');
            const subject = replaceVars(node.data.subject || `Re: ${payload.subject || 'Contato'}`);
            const body = replaceVars(node.data.body || node.data.content || 'Sem conteúdo');
            
            const { MailService: Mail } = await import("./mail.service");
            await Mail.sendEmail(emailInt, to, subject, body, payload.messageId);
            
            // Save outgoing message to inbox
            const convo = await prisma.conversation.findFirst({ where: { tenantId: payload.tenantId, contactId: to, channel: 'email' } });
            if (convo) {
              await prisma.message.create({
                data: {
                  conversationId: convo.id,
                  tenantId: payload.tenantId,
                  content: body,
                  channel: 'email',
                  senderId: 'system',
                  timestamp: new Date()
                }
              });
            }
            console.log(`Service: ✅ Workflow Email sent as reply to ${to}`);
          } else if (node.type === 'ai') {
            console.log(`Service: 🤖 Processing AI step for ${workflow.name}...`);
            const prompt = (node.data.prompt || '').replace('{{message.content}}', payload.content || payload.body || '');
            
            // Mock AI response if key missing, or try real call
            if (!process.env.GEMINI_API_KEY) {
               payload.ai_response = "Aguardando chave de API Gemini para responder...";
            } else {
               try {
                 const { GoogleGenAI } = await import("@google/genai");
                 const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                 const result = await genAI.models.generateContent({
                   model: "gemini-1.5-flash",
                   contents: [{ role: 'user', parts: [{ text: prompt }] }]
                 });
                 payload.ai_response = (result as any).value?.content?.parts?.[0]?.text || (result as any).text || "No response";
               } catch (aiErr: any) {
                 console.error("AI Error:", aiErr.message);
                 payload.ai_response = "Erro ao processar IA.";
               }
            }
            console.log(`Service: 🤖 AI Response: ${payload.ai_response.substring(0, 50)}...`);

          } else if (node.type === 'action' && node.data.action === 'send_whatsapp') {
            const content = node.data.content.replace('{{ai_response}}', payload.ai_response || '');
            console.log(`Service: 📱 WhatsApp Message simulated to ${payload.sender || 'default'}: ${content}`);
            // Here you would call a WhatsApp API service
          }
        } catch (error: any) {
          console.error(`Service: ❌ Error executing node ${node.type}:`, error.message);
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
    await this.processEvent('module_record_created', { ...newDeal, moduleId: 'deals' });
  }
}
