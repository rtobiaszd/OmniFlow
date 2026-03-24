import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { Pipeline, Deal } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const PIPELINES_COLLECTION = 'pipelines';
const DEALS_COLLECTION = 'deals';

export const pipelineService = {
  // Pipeline operations
  async getPipelines(tenantId: string): Promise<Pipeline[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, PIPELINES_COLLECTION), where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() } as Pipeline));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, PIPELINES_COLLECTION);
      return [];
    }
  },

  subscribeToPipelines(tenantId: string, callback: (pipelines: Pipeline[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, PIPELINES_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      const pipelines = snapshot.docs.map(doc => ({ ...doc.data() } as Pipeline));
      callback(pipelines);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, PIPELINES_COLLECTION);
    });
  },

  async createPipeline(tenantId: string, name: string) {
    if (!db) return;
    try {
      const id = `pipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pipeline: Pipeline = {
        id,
        name,
        stages: [
          { id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name: 'New Stage', order: 0, color: 'bg-blue-500' }
        ],
        customFields: [],
        tenantId
      };
      await setDoc(doc(db, PIPELINES_COLLECTION, id), pipeline);
      return pipeline;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, PIPELINES_COLLECTION);
    }
  },

  async updatePipeline(pipeline: Partial<Pipeline> & { id: string }) {
    if (!db) return;
    try {
      const docRef = doc(db, PIPELINES_COLLECTION, pipeline.id);
      // Remove undefined values to prevent Firestore errors
      const cleanData = Object.fromEntries(
        Object.entries(pipeline).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(docRef, cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${PIPELINES_COLLECTION}/${pipeline.id}`);
    }
  },

  async deletePipeline(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, PIPELINES_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${PIPELINES_COLLECTION}/${id}`);
    }
  },

  // Deal operations
  subscribeToDeals(tenantId: string, callback: (deals: Deal[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, DEALS_COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      const deals = snapshot.docs.map(doc => ({ ...doc.data() } as Deal));
      callback(deals);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, DEALS_COLLECTION);
    });
  },

  async createDeal(tenantId: string, deal: Omit<Deal, 'id' | 'createdAt' | 'tenantId'>) {
    if (!db) return;
    try {
      const id = `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newDeal: Deal = {
        ...deal,
        id,
        createdAt: new Date().toISOString(),
        tenantId
      };
      await setDoc(doc(db, DEALS_COLLECTION, id), newDeal);
      return newDeal;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, DEALS_COLLECTION);
    }
  },

  async updateDeal(deal: Partial<Deal> & { id: string }) {
    if (!db) return;
    try {
      const docRef = doc(db, DEALS_COLLECTION, deal.id);
      // Remove undefined values to prevent Firestore errors
      const cleanData = Object.fromEntries(
        Object.entries(deal).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(docRef, cleanData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${DEALS_COLLECTION}/${deal.id}`);
    }
  },

  async deleteDeal(id: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, DEALS_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${DEALS_COLLECTION}/${id}`);
    }
  }
};
