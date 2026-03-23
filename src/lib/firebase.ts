import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Import the Firebase configuration
import firebaseConfig from '../../firebase-applet-config.json';

// Check if we have the minimum required config
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Initialize Analytics if supported
  isSupported().then(yes => yes && getAnalytics(app));
}

export const auth = isFirebaseConfigured ? getAuth(app) : null;
export const db = isFirebaseConfigured ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;
export const googleProvider = new GoogleAuthProvider();
