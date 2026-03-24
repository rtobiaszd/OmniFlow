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
    const id = `pipe_${Date.now()}`;
    const pipeline: Pipeline = {
      id,
      name,
      stages: [
        { id: `stage_${Date.now()}`, name: 'New Stage', order: 0, color: 'bg-blue-500' }
      ],
      customFields: [],
      tenantId
    };
    await setDoc(doc(db, PIPELINES_COLLECTION, id), pipeline);
    return pipeline;
  },

  async updatePipeline(pipeline: Partial<Pipeline> & { id: string }) {
    if (!db) return;
    const docRef = doc(db, PIPELINES_COLLECTION, pipeline.id);
    // Remove undefined values to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(pipeline).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(docRef, cleanData);
  },

  async deletePipeline(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, PIPELINES_COLLECTION, id));
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
    const id = `deal_${Date.now()}`;
    const newDeal: Deal = {
      ...deal,
      id,
      createdAt: new Date().toISOString(),
      tenantId
    };
    await setDoc(doc(db, DEALS_COLLECTION, id), newDeal);
    return newDeal;
  },

  async updateDeal(deal: Partial<Deal> & { id: string }) {
    if (!db) return;
    const docRef = doc(db, DEALS_COLLECTION, deal.id);
    // Remove undefined values to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(deal).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(docRef, cleanData);
  },

  async deleteDeal(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, DEALS_COLLECTION, id));
  }
};
