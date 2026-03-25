import prisma from '../lib/prisma';
import { Conversation, Message } from '@prisma/client';

export class MessageRepository {
  async findAllByConversation(conversationId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' }
    });
  }

  async create(data: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const msg = await prisma.message.create({
      data: {
        ...data,
        timestamp: new Date()
      }
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: {
        lastMessage: data.content,
        lastMessageTime: new Date()
      }
    });

    return msg;
  }
}

export class ConversationRepository {
  async findByTenant(tenantId: string): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { lastMessageTime: 'desc' }
    });
  }

  async findById(id: string): Promise<Conversation | null> {
    return prisma.conversation.findUnique({ where: { id } });
  }

  async findOrCreate(tenantId: string, contactId: string, data: Partial<Conversation>): Promise<Conversation> {
     const existing = await prisma.conversation.findFirst({
       where: { tenantId, contactId, channel: data.channel }
     });

     if (existing) return existing;

     return prisma.conversation.create({
       data: {
         id: `conv_${Date.now()}`,
         tenantId,
         contactId,
         contactName: data.contactName || 'New Contact',
         contactAvatar: data.contactAvatar || 'https://picsum.photos/seed/default/100/100',
         lastMessage: data.lastMessage || '',
         channel: data.channel || 'generic',
         status: 'open'
       }
     });
  }
}
