import { Integration } from '../types';

const API_BASE = '/api/integrations';

export const integrationService = {
  async getIntegrations(tenantId: string): Promise<Integration[]> {
    try {
      const resp = await fetch(`${API_BASE}?tenantId=${tenantId}`);
      if (!resp.ok) throw new Error('Failed to fetch');
      const data = await resp.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  },

  // Note: Subscription is simulated since we don't have WebSockets/live query in the new backend yet
  // We'll just call the callback once, or better, the UI should poll or refreshen
  subscribeToIntegrations(tenantId: string, callback: (integrations: Integration[]) => void) {
    this.getIntegrations(tenantId).then(callback);
    // Poll every 30s as a fallback for "real-time"
    const interval = setInterval(() => {
      this.getIntegrations(tenantId).then(callback);
    }, 30000);
    return () => clearInterval(interval);
  },

  async updateIntegration(integration: Partial<Integration> & { id: string }) {
    const resp = await fetch(`${API_BASE}/${integration.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(integration)
    });
    return resp.ok;
  },

  async connectIntegration(tenantId: string, provider: Integration['provider'], name: string, config: Record<string, any> = {}) {
    const integration = {
      id: `${tenantId}_${provider}`,
      tenantId,
      provider,
      name,
      status: 'connected',
      active: true,
      config: { ...config, connectedAt: new Date().toISOString() }
    };
    
    const resp = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(integration)
    });
    
    if (!resp.ok) throw new Error('Failed to connect');
    const result = await resp.json();
    return result.data;
  },

  async disconnectIntegration(id: string) {
    const resp = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    return resp.ok;
  }
};
