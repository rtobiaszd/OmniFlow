import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'manager' | 'agent';
  tenantId: string;
  createdAt: any;
}

export const userService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    if (!db) return null;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  async createProfile(profile: Omit<UserProfile, 'createdAt'>): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, 'users', profile.uid);
      await setDoc(docRef, {
        ...profile,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};
