import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Appointment } from '../types';

export const calendarService = {
  subscribeToAppointments: (tenantId: string, callback: (appointments: Appointment[]) => void) => {
    if (!db) return () => {};
    const q = query(
      collection(db, 'appointments'),
      where('tenantId', '==', tenantId),
      orderBy('startTime', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      callback(appointments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
    });
  },

  createAppointment: async (tenantId: string, appointmentData: Omit<Appointment, 'id' | 'tenantId' | 'createdAt'>) => {
    if (!db) return;
    try {
      return await addDoc(collection(db, 'appointments'), {
        ...appointmentData,
        tenantId,
        createdAt: Timestamp.now().toDate().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    }
  },

  updateAppointment: async (id: string, appointmentData: Partial<Appointment>) => {
    if (!db) return;
    try {
      const appointmentRef = doc(db, 'appointments', id);
      return await updateDoc(appointmentRef, {
        ...appointmentData
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  },

  deleteAppointment: async (id: string) => {
    if (!db) return;
    try {
      return await deleteDoc(doc(db, 'appointments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
    }
  }
};
