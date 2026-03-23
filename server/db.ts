import { Pipeline, Deal, Workflow, Integration, Message } from "../src/types";

export const db = {
  pipelines: [
    {
      id: 'p1',
      name: 'Main Sales Pipeline',
      stages: [
        { id: 's1', name: 'New Leads', order: 0, color: 'bg-blue-500' },
        { id: 's2', name: 'Contacted', order: 1, color: 'bg-indigo-500' },
        { id: 's3', name: 'Qualified', order: 2, color: 'bg-purple-500' },
        { id: 's4', name: 'Proposal', order: 3, color: 'bg-orange-500' },
        { id: 's5', name: 'Negotiation', order: 4, color: 'bg-yellow-500' },
        { id: 's6', name: 'Closed Won', order: 5, color: 'bg-green-500' },
      ],
      customFields: [
        { id: 'cf1', name: 'Source', type: 'select', options: ['Website', 'Referral', 'Cold Call'], required: false },
        { id: 'cf2', name: 'Expected Close Date', type: 'date', required: true }
      ]
    },
    {
      id: 'p2',
      name: 'Support Tickets',
      stages: [
        { id: 's7', name: 'Open', order: 0, color: 'bg-red-500' },
        { id: 's8', name: 'In Progress', order: 1, color: 'bg-blue-500' },
        { id: 's9', name: 'Resolved', order: 2, color: 'bg-green-500' },
      ],
      customFields: [
        { id: 'cf3', name: 'Priority', type: 'select', options: ['P0', 'P1', 'P2'], required: true }
      ]
    }
  ] as Pipeline[],
  deals: [
    { id: '1', title: 'Enterprise License', company: 'TechCorp', value: 12000, stageId: 's1', pipelineId: 'p1', priority: 'high', status: 'open', customValues: {}, assignedTo: 'JD', createdAt: '2026-03-20', contactId: 'c1' },
    { id: '2', title: 'API Integration', company: 'GlobalSoft', value: 5500, stageId: 's1', pipelineId: 'p1', priority: 'medium', status: 'open', customValues: {}, assignedTo: 'AS', createdAt: '2026-03-21', contactId: 'c2' },
    { id: '3', title: 'Support Issue #1', company: 'StartupInc', value: 0, stageId: 's7', pipelineId: 'p2', priority: 'high', status: 'open', customValues: { cf3: 'P0' }, assignedTo: 'JD', createdAt: '2026-03-22', contactId: 'c3' },
  ] as Deal[],
  workflows: [
    { 
      id: 'w1', 
      name: 'WhatsApp Lead Capture', 
      description: 'Automatically creates a deal when a new contact messages on WhatsApp.', 
      active: true, 
      nodes: [
        { id: 'n1', type: 'trigger', data: { event: 'message_received', channel: 'whatsapp' }, position: { x: 0, y: 0 } },
        { id: 'n2', type: 'action', data: { action: 'create_deal', pipelineId: 'p1', stageId: 's1' }, position: { x: 200, y: 0 } }
      ] 
    }
  ] as Workflow[],
  integrations: [
    { 
      id: 'i1', 
      provider: 'whatsapp', 
      name: 'WhatsApp Business', 
      status: 'connected', 
      config: {},
      authUrl: process.env.OAUTH || "https://example.com/oauth/authorize"
    },
    { 
      id: 'i2', 
      provider: 'jira', 
      name: 'Jira Cloud', 
      status: 'error', 
      config: {},
      authUrl: process.env.OAUTH || "https://example.com/oauth/authorize"
    }
  ] as Integration[],
  messages: [] as Message[],
  events: [] as any[]
};
