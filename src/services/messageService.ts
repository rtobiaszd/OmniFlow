import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { Message } from '../types';

const MESSAGES_COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';

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

export const messageService = {
  subscribeToConversations(tenantId: string, callback: (conversations: Conversation[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION), 
      where('tenantId', '==', tenantId),
      orderBy('lastMessageTime', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Conversation));
      callback(conversations);
    });
  },

  subscribeToMessages(tenantId: string, conversationId: string, callback: (messages: Message[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, MESSAGES_COLLECTION), 
      where('tenantId', '==', tenantId),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Message));
      callback(messages);
    });
  },

  async sendMessage(tenantId: string, conversationId: string, content: string, channel: string, senderId?: string) {
    if (!db) return;
    
    const messageData: Omit<Message, 'id'> = {
      conversationId,
      tenantId,
      content,
      channel: channel as any,
      timestamp: new Date().toISOString(),
      senderId
    };

    await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

    // Update conversation last message
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await setDoc(convRef, {
      lastMessage: content,
      lastMessageTime: new Date().toISOString()
    }, { merge: true });
  }
};
