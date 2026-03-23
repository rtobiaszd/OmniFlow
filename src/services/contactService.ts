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
    });
  },

  createContact: async (tenantId: string, contactData: Omit<Contact, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
    if (!db) return;
    return addDoc(collection(db, 'contacts'), {
      ...contactData,
      tenantId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  },

  updateContact: async (id: string, contactData: Partial<Contact>) => {
    if (!db) return;
    const contactRef = doc(db, 'contacts', id);
    return updateDoc(contactRef, {
      ...contactData,
      updatedAt: Timestamp.now()
    });
  },

  deleteContact: async (id: string) => {
    if (!db) return;
    return deleteDoc(doc(db, 'contacts', id));
  }
};
