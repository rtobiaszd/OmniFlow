import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { Integration } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const COLLECTION = 'integrations';

export const integrationService = {
  async getIntegrations(tenantId: string): Promise<Integration[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, COLLECTION), where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() } as Integration));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
      return [];
    }
  },

  subscribeToIntegrations(tenantId: string, callback: (integrations: Integration[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      const integrations = snapshot.docs.map(doc => ({ ...doc.data() } as Integration));
      callback(integrations);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
    });
  },

  async updateIntegration(integration: Partial<Integration> & { id: string }) {
    if (!db) return;
    const docRef = doc(db, COLLECTION, integration.id);
    // Remove undefined values to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(integration).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(docRef, cleanData);
  },

  async connectIntegration(tenantId: string, provider: Integration['provider'], name: string, config: Record<string, any> = {}) {
    if (!db) return;
    const id = `${tenantId}_${provider}`;
    const integration: Integration = {
      id,
      tenantId,
      provider,
      name,
      status: 'connected',
      config: { ...config, connectedAt: new Date().toISOString() }
    };
    await setDoc(doc(db, COLLECTION, id), integration);
    return integration;
  },

  async disconnectIntegration(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, COLLECTION, id));
  }
};
