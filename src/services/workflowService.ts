import { Workflow } from '../types';

const API_BASE = '/api/workflows';

export const workflowService = {
  async getWorkflows(tenantId: string): Promise<Workflow[]> {
    try {
      const resp = await fetch(`${API_BASE}?tenantId=${tenantId}`);
      if (!resp.ok) throw new Error('Failed to fetch');
      const data = await resp.json();
      const workflows = data.data || [];
      return workflows.filter((w: Workflow) => w.tenantId === tenantId);
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  subscribeToWorkflows(tenantId: string, callback: (workflows: Workflow[]) => void) {
    this.getWorkflows(tenantId).then(callback);
    const interval = setInterval(() => {
      this.getWorkflows(tenantId).then(callback);
    }, 15000);
    return () => clearInterval(interval);
  },

  async createWorkflow(tenantId: string, name: string, description: string = '') {
    const resp = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, name, description })
    });
    const data = await resp.json();
    return data.data;
  },

  async updateWorkflow(workflow: Workflow) {
    const resp = await fetch(`${API_BASE}/${workflow.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
    const data = await resp.json();
    return data.data;
  },

  async deleteWorkflow(id: string) {
    const resp = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    return resp.ok;
  },

  async toggleActive(id: string, active: boolean) {
    const resp = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    return resp.ok;
  }
};
