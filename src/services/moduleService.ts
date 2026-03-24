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
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { ModuleDefinition, ModuleRecord } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const MODULE_DEFINITIONS_COLLECTION = 'module_definitions';
const MODULE_RECORDS_COLLECTION = 'module_records';

export const moduleService = {
  // Module Definitions
  subscribeToModuleDefinitions(tenantId: string, callback: (modules: ModuleDefinition[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, MODULE_DEFINITIONS_COLLECTION), 
      where('tenantId', '==', tenantId)
    );
    return onSnapshot(q, (snapshot) => {
      const modules = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ModuleDefinition));
      callback(modules);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, MODULE_DEFINITIONS_COLLECTION);
    });
  },

  async createModuleDefinition(tenantId: string, definition: Omit<ModuleDefinition, 'id' | 'createdAt' | 'tenantId'>) {
    if (!db) return;
    const id = `mod_${Date.now()}`;
    const newDefinition: ModuleDefinition = {
      ...definition,
      id,
      tenantId,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, MODULE_DEFINITIONS_COLLECTION, id), newDefinition);
    return newDefinition;
  },

  async updateModuleDefinition(id: string, definition: Partial<ModuleDefinition>) {
    if (!db) return;
    const docRef = doc(db, MODULE_DEFINITIONS_COLLECTION, id);
    await updateDoc(docRef, { ...definition });
  },

  async deleteModuleDefinition(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, MODULE_DEFINITIONS_COLLECTION, id));
    // Also delete all records associated with this module
    const q = query(collection(db, MODULE_RECORDS_COLLECTION), where('moduleId', '==', id));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  },

  // Module Records
  subscribeToModuleRecords(moduleId: string, tenantId: string, callback: (records: ModuleRecord[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, MODULE_RECORDS_COLLECTION), 
      where('moduleId', '==', moduleId),
      where('tenantId', '==', tenantId)
    );
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ModuleRecord));
      callback(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, MODULE_RECORDS_COLLECTION);
    });
  },

  async createModuleRecord(tenantId: string, moduleId: string, data: Record<string, any>) {
    if (!db) return;
    const id = `rec_${Date.now()}`;
    const newRecord: ModuleRecord = {
      id,
      moduleId,
      tenantId,
      data,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, MODULE_RECORDS_COLLECTION, id), newRecord);
    return newRecord;
  },

  async updateModuleRecord(id: string, data: Record<string, any>) {
    if (!db) return;
    const docRef = doc(db, MODULE_RECORDS_COLLECTION, id);
    await updateDoc(docRef, { data });
  },

  async deleteModuleRecord(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, MODULE_RECORDS_COLLECTION, id));
  }
};
