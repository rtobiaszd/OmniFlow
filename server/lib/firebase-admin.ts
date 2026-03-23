import admin from 'firebase-admin';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.app();

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  // Fallback for local development
  return admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
}

// Initialize immediately when module is loaded
initializeFirebaseAdmin();

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export { admin };
