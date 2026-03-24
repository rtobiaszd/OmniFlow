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
  provider: 'whatsapp' | 'email' | 'telegram' | 'jira' | 'github' | 'slack' | 'facebook' | 'instagram' | 'webhook' | 'api' | 'google_sheets' | 'gmail' | 'google_drive' | 'google_calendar' | 'outlook_calendar' | 'google_cloud';
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
  trigger?: 'message' | 'event' | 'time' | 'stage_change' | 'module_record_created';
  nodes: WorkflowNode[];
  edges?: any[]; // For node-based flow
  integrationId?: string;
  pipelineId?: string;
  tenantId: string;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'ai' | 'delay' | 'webhook' | 'api' | 'google_sheets' | 'gmail' | 'slack_msg' | 'google_drive' | 'google_cloud' | 'schedule' | 'module_record';
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
  tenantId: string;
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
  tenantId: string;
}

export interface Message {
  id: string;
  conversationId: string;
  tenantId: string;
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

export interface ModuleField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'relation' | 'boolean';
  required: boolean;
  options?: string[]; // For select
  relationModuleId?: string; // For relation
}

export interface ModuleDefinition {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  fields: ModuleField[];
  createdAt: string;
}

export interface ModuleRecord {
  id: string;
  moduleId: string;
  tenantId: string;
  data: Record<string, any>;
  createdAt: string;
}
