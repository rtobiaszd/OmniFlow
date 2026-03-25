import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
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
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      console.log('Firebase Admin: Initializing with service account key...');
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      app.firestore().settings({ ignoreUndefinedProperties: true });
      return app;
    } catch (error) {
      console.error('Firebase Admin: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  // Fallback for local development or Google ADC
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  console.log(`Firebase Admin: Falling back to ADC or default init for project: ${projectId}`);
  
  return admin.initializeApp({
    projectId: projectId
  });
}

export const getAdminAuth = () => {
  initializeFirebaseAdmin();
  return admin.auth();
};

export const getAdminDb = () => {
  const app = initializeFirebaseAdmin();
  const dbId = firebaseConfig.firestoreDatabaseId;
  return dbId ? getFirestore(app as any, dbId) : getFirestore(app as any);
};

export { admin };
