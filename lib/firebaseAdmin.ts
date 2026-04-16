import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Load Firebase Applet Config if it exists to get the Project ID and Database ID
let projectId = process.env.FIREBASE_PROJECT_ID;
let databaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    // Prioritize config file over environment variables for remixed apps
    projectId = config.projectId || projectId;
    databaseId = config.firestoreDatabaseId || databaseId;
    
    if (projectId === 'remixed-project-id') {
      console.error("CRITICAL: Firebase Project ID is still set to 'remixed-project-id'. Please run the Firebase Setup tool to configure your own project.");
    }
    
    console.log(`Loaded config: Project=${projectId}, Database=${databaseId}`);
  }
} catch (e) {
  console.warn("Could not load firebase-applet-config.json for admin init");
}

let adminApp: admin.app.App | null = null;

try {
  if (!admin.apps.length) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar) {
      try {
        const serviceAccount = JSON.parse(serviceAccountVar);
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: projectId
        });
        console.log("Firebase Admin initialized with service account");
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT secret. Falling back to default credentials.");
      }
    }

    if (!adminApp) {
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: projectId
      });
      console.log(`Firebase Admin initialized with applicationDefault for project ${projectId}`);
    }
  } else {
    adminApp = admin.apps[0];
  }
} catch (e) {
  console.error("Firebase Admin initialization failed. Admin features (like Stripe webhooks) may not work.", e);
}

// Use the specific database ID if provided
export let adminDb: admin.firestore.Firestore | null = null;

if (adminApp) {
  // If databaseId is the same as projectId, it's likely a misconfiguration in the config file
  // where the project ID was put into the firestoreDatabaseId field.
  // In most cases, the database ID should be "(default)".
  const actualDatabaseId = (databaseId === projectId || !databaseId || databaseId === 'remixed-firestore-database-id') ? undefined : databaseId;
  
  try {
    adminDb = actualDatabaseId ? getFirestore(adminApp, actualDatabaseId) : getFirestore(adminApp);
    console.log(`Admin Firestore initialized for database: ${actualDatabaseId || '(default)'}`);
  } catch (e) {
    console.error(`Failed to initialize Firestore for database ${actualDatabaseId || '(default)'}. Falling back to default.`, e);
    adminDb = getFirestore(adminApp);
  }
}

export const adminAuth = adminApp ? adminApp.auth() : null;
export { adminApp, databaseId };
