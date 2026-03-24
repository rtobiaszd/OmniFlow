import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export interface Contact {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'Lead' | 'Customer' | 'Active' | 'Inactive';
  createdAt: any;
  updatedAt: any;
}

export const contactService = {
  subscribeToContacts: (tenantId: string, callback: (contacts: Contact[]) => void) => {
    if (!db) return () => {};
    const q = query(
      collection(db, 'contacts'),
      where('tenantId', '==', tenantId)
    );

    return onSnapshot(q, (snapshot) => {
      const contacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      callback(contacts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contacts');
    });
  },

  createContact: async (tenantId: string, contactData: Omit<Contact, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
    if (!db) return;
    try {
      return await addDoc(collection(db, 'contacts'), {
        ...contactData,
        tenantId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'contacts');
    }
  },

  updateContact: async (id: string, contactData: Partial<Contact>) => {
    if (!db) return;
    try {
      const contactRef = doc(db, 'contacts', id);
      return await updateDoc(contactRef, {
        ...contactData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `contacts/${id}`);
    }
  },

  deleteContact: async (id: string) => {
    if (!db) return;
    try {
      return await deleteDoc(doc(db, 'contacts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contacts/${id}`);
    }
  }
};
