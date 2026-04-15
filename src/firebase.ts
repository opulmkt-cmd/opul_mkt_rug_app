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
    // ✅ SIMPLE & CORRECT
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app); // ✅ IMPORTANT FIX

    console.log("🔥 Firebase initialized:", firebaseConfig.projectId);

    return { auth, db };
  } catch (error) {
    console.error('Firebase init error:', error);
    throw error;
  }
}

// Optional debug
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("✅ Firestore connected");
  } catch (error) {
    console.error("❌ Firestore connection failed:", error);
  }
}

export { signInWithPopup, signOut, onAuthStateChanged };
export type { FirebaseUser };
