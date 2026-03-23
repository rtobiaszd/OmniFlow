export interface Tenant {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'agent';
  tenantId: string;
}

export interface Integration {
  id: string;
  provider: 'whatsapp' | 'email' | 'telegram' | 'jira' | 'github' | 'slack' | 'facebook' | 'instagram' | 'webhook' | 'api';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  tenantId: string;
  authUrl?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  nodes: WorkflowNode[];
  edges?: any[]; // For node-based flow
  integrationId?: string;
  pipelineId?: string;
  tenantId: string;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'ai' | 'delay' | 'webhook' | 'api';
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[]; // For select type
  required: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
  customFields: CustomField[];
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  useAI?: boolean;
  automation?: {
    onEnter?: string; // Workflow ID
  };
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  company: string;
  contactId: string;
  stageId: string;
  pipelineId: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'won' | 'lost';
  customValues: Record<string, any>;
  assignedTo: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string;
  contactId?: string;
  content: string;
  channel: 'whatsapp' | 'email' | 'telegram' | 'facebook' | 'instagram';
  timestamp: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  niche: string;
  nodes: WorkflowNode[];
  edges?: any[];
}
