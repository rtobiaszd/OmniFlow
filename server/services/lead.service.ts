import prisma from '../lib/prisma';

export class LeadService {
  async ensureLeadPipeline(tenantId: string) {
    let pipeline = await prisma.pipeline.findFirst({
      where: { tenantId, name: 'Leads' }
    });

    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: {
          id: `pipe_leads_${Date.now()}`,
          name: 'Leads',
          tenantId,
          stages: [
            { id: 'lead_stage_1', name: 'Novo Lead', color: '#3B82F6' },
            { id: 'lead_stage_2', name: 'Em Contato', color: '#F59E0B' },
            { id: 'lead_stage_3', name: 'Qualificado', color: '#10B981' }
          ],
          customFields: []
        }
      });
      console.log(`LeadService: Created standard 'Leads' pipeline for tenant ${tenantId}`);
    }

    return pipeline;
  }

  async createLeadIfNotExist(tenantId: string, contactData: { contactId: string; contactName: string; source: string }) {
    try {
      const pipeline = await this.ensureLeadPipeline(tenantId);
      
      const stages: any[] = Array.isArray(pipeline.stages) ? pipeline.stages as any[] : [];
      const firstStageId = stages.length > 0 ? stages[0].id : 'lead_stage_1';

      const existing = await prisma.deal.findFirst({
        where: {
          tenantId,
          pipelineId: pipeline.id,
          contactId: contactData.contactId
        }
      });

      if (!existing) {
        await prisma.deal.create({
          data: {
            id: `deal_lead_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            title: `Lead: ${contactData.contactName}`,
            value: 0,
            company: '', // Optional/empty by default
            contactId: contactData.contactId,
            stageId: firstStageId,
            pipelineId: pipeline.id,
            priority: 'medium',
            status: 'open',
            customValues: {
              source: contactData.source
            },
            assignedTo: 'unassigned',
            tenantId
          }
        });
        console.log(`LeadService: ✅ Created new Lead deal for ${contactData.contactName} (${contactData.contactId}) via ${contactData.source}`);
      }
    } catch (error: any) {
      console.error(`LeadService: ❌ Error creating lead deal:`, error.message);
    }
  }
}
