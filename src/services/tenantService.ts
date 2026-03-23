import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Tenant {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
  createdAt: any;
}

export const tenantService = {
  async getTenant(tenantId: string): Promise<Tenant | null> {
    if (!db) return null;
    try {
      const docRef = doc(db, 'tenants', tenantId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Tenant;
      }
      return null;
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  },

  async createTenant(name: string, plan: 'starter' | 'pro' | 'enterprise' = 'starter'): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    try {
      const tenantRef = doc(collection(db, 'tenants'));
      const tenantId = tenantRef.id;
      await setDoc(tenantRef, {
        id: tenantId,
        name,
        plan,
        createdAt: serverTimestamp()
      });
      return tenantId;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }
};
