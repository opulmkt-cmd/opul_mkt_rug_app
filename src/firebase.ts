import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from "firebase/firestore";

// Firebase config from VITE env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp;
export let auth: Auth;
export let db: Firestore;

export const googleProvider = new GoogleAuthProvider();

export async function initFirebase() {
  if (app) return { auth, db };

  try {
    if (!firebaseConfig.apiKey) {
      throw new Error("Missing Firebase ENV variables");
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    testConnection();

    return { auth, db };
  } catch (error) {
    console.error("Firebase init failed:", error);
    throw error;
  }
}

// Operation types for error handling
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

// Firestore error handler
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  if (!auth) throw error;

  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((p) => ({
          providerId: p.providerId,
          displayName: p.displayName,
          email: p.email,
          photoUrl: p.photoURL,
        })) || [],
    },
    operationType,
    path,
  };

  console.error("Firestore Error:", errInfo);

  throw new Error(JSON.stringify(errInfo));
}

// Test Firestore connection
export async function testConnection() {
  if (!db) return;

  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error.message?.includes("offline")) {
      console.error("Firebase appears offline");
    }
  }
}

export { signInWithPopup, signOut, onAuthStateChanged };
export type { FirebaseUser };
