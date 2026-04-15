import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';

import firebaseConfig from '../firebase-applet-config.json';

let app: FirebaseApp;
export let auth: Auth;
export let db: Firestore;

export const googleProvider = new GoogleAuthProvider();

export async function initFirebase() {
  if (app) return { auth, db };

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log("🔥 Firebase initialized:", firebaseConfig.projectId);

    return { auth, db };
  } catch (error) {
    console.error('❌ Firebase init error:', error);
    throw error;
  }
}

// ✅ Required for your app
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// ✅ Required for your app
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    userId: auth?.currentUser?.uid,
    email: auth?.currentUser?.email,
  };

  console.error('🔥 Firestore Error:', errInfo);

  throw new Error(errInfo.error);
}

// Optional debug
export async function testConnection() {
  if (!db) return;

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("✅ Firestore connected");
  } catch (error) {
    console.warn("⚠️ Firestore connection issue:", error);
  }
}

export { signInWithPopup, signOut, onAuthStateChanged };
export type { FirebaseUser };
