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
import { Workflow } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const COLLECTION = 'workflows';

export const workflowService = {
  async getWorkflows(tenantId: string): Promise<Workflow[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, COLLECTION), where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Workflow));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
      return [];
    }
  },

  subscribeToWorkflows(tenantId: string, callback: (workflows: Workflow[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, COLLECTION), where('tenantId', '==', tenantId));
    return onSnapshot(q, (snapshot) => {
      const workflows = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Workflow));
      callback(workflows);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
    });
  },

  async createWorkflow(tenantId: string, name: string, description: string) {
    if (!db) return;
    const id = `wf_${Date.now()}`;
    const workflow: Workflow = {
      id,
      name,
      description,
      active: false,
      nodes: [],
      tenantId
    };
    await setDoc(doc(db, COLLECTION, id), workflow);
    return workflow;
  },

  async updateWorkflow(workflow: Partial<Workflow> & { id: string }) {
    if (!db) return;
    const docRef = doc(db, COLLECTION, workflow.id);
    const { id, ...data } = workflow;
    // Remove undefined values to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(docRef, cleanData);
  },

  async deleteWorkflow(id: string) {
    if (!db) {
      console.error('Firestore database not initialized');
      return;
    }
    console.log(`Deleting document ${id} from collection ${COLLECTION}`);
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async toggleActive(id: string, active: boolean) {
    if (!db) return;
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, { active });
  }
};
