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

let app: FirebaseApp;
export let auth: Auth;
export let db: Firestore;

export const googleProvider = new GoogleAuthProvider();

export async function initFirebase() {
  if (app) return { auth, db };

  try {
    let config = null;

    // ✅ 1. Try backend (BEST - consistent with server)
    try {
      const res = await fetch("/api/config/firebase");
      if (res.ok) {
        config = await res.json();
      }
    } catch (e) {
      console.warn("Backend config fetch failed, falling back to env");
    }

    // ✅ 2. Fallback to Vite ENV
    if (!config || !config.apiKey) {
      config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId:
          import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
    }

    // ❌ No config → fail clearly
    if (!config || !config.apiKey) {
      throw new Error("Firebase config missing (ENV or API)");
    }

    // ✅ Init
    app = initializeApp(config);
    auth = getAuth(app);

    // ✅ Firestore DB (supports optional multi-db)
    db = getFirestore(app, config.firestoreDatabaseId || "(default)");

    // ✅ Test connection
    testConnection();

    return { auth, db };
  } catch (error) {
    console.error("❌ Firebase init failed:", error);
    throw error;
  }
}

---

# 🔥 ERROR HANDLING (UNCHANGED BUT CLEANED)

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

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

  console.error("🔥 Firestore Error:", errInfo);

  throw new Error(JSON.stringify(errInfo));
}

---

# 🔍 CONNECTION TEST

export async function testConnection() {
  if (!db) return;

  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error.message?.includes("offline")) {
      console.error("⚠️ Firebase appears offline");
    }
  }
}

---

export { signInWithPopup, signOut, onAuthStateChanged };
export type { FirebaseUser };
