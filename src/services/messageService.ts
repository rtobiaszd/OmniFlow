import { Message } from '../types';

export interface Conversation {
  id: string;
  tenantId: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  channel: string;
  status: 'open' | 'closed';
}

const API_BASE = '/api';

export const messageService = {
  async getConversations(tenantId: string): Promise<Conversation[]> {
    const resp = await fetch(`${API_BASE}/conversations?tenantId=${tenantId}`);
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.success ? json.data : [];
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const resp = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
    if (!resp.ok) return [];
    const json = await resp.json();
    return json.success ? json.data : [];
  },

  async sendMessage(tenantId: string, conversationId: string, content: string, channel: string, senderId?: string) {
    const resp = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, conversationId, content, channel, senderId })
    });
    return resp.json();
  },

  // Polling simulation for Real-time
  subscribeToConversations(tenantId: string, callback: (conversations: Conversation[]) => void) {
    const interval = setInterval(async () => {
      const data = await this.getConversations(tenantId);
      callback(data);
    }, 5000);
    this.getConversations(tenantId).then(callback);
    return () => clearInterval(interval);
  },

  subscribeToMessages(tenantId: string, conversationId: string, callback: (messages: Message[]) => void) {
    const interval = setInterval(async () => {
      const data = await this.getMessages(conversationId);
      callback(data);
    }, 3000);
    this.getMessages(conversationId).then(callback);
    return () => clearInterval(interval);
  }
};
