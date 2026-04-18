import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { FirebaseUser } from '../firebase';
import { initFirebase, onAuthStateChanged, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  credits: number;
  tier: string;
  role: 'user' | 'admin';
  pendingUpgradeId?: string | null;
  pendingTierId?: string | null;
  trialEndsAt?: string | null;
  isTrial?: boolean; // 🔥 ADDED
  createdAt: any;
}

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  isAuthReady: boolean;
  firebaseReady: boolean;
}

const FirebaseContext = React.createContext<FirebaseContextType | undefined>(undefined);

export function useFirebase() {
  const context = React.useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
}

const ADMIN_EMAILS = [
  'adilabbas812@gmail.com',
  'aimanmaniyar20@gmail.com'
];

const DEMO_EMAILS = [
  'demo@opulmkt.com',
  'estaunton@icloud.com'
];

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [firebaseReady, setFirebaseReady] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let unsubscribeAuth: (() => void) | null = null;
    let unsubscribeProfile: (() => void) | null = null;

    const setup = async () => {
      try {
        const { auth, db } = await initFirebase();
        setFirebaseReady(true);

        unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
          setUser(currentUser);
          setIsAuthReady(true);

          if (currentUser) {
            setProfileLoading(true);

            const userRef = doc(db, 'users', currentUser.uid);

            try {
              const userDoc = await getDoc(userRef);

              if (!userDoc.exists()) {

                const isAdmin = ADMIN_EMAILS.includes(currentUser.email || '');
                const isDemo = DEMO_EMAILS.includes(currentUser.email || '');

                await setDoc(userRef, {
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName,
                  photoURL: currentUser.photoURL,
                  credits: isAdmin ? 999 : (isDemo ? 20 : 5),
                  tier: isAdmin ? 'pro' : 'free',
                  role: isAdmin ? 'admin' : 'user',
                  isTrial: false,
                  createdAt: serverTimestamp(),
                });

                localStorage.removeItem('guest_credits');
              }

              // 🔥 LISTENER
              unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
                if (docSnap.exists()) {
                  const data = docSnap.data() as UserProfile;

                  // =====================================================
                  // 🔥 TRIAL EXPIRY FIX (FINAL)
                  // =====================================================
                  if (data.isTrial && data.trialEndsAt && data.tier === 'creator') {
                    const now = new Date();
                    const expiry = new Date(data.trialEndsAt);

                    if (now > expiry) {
                      console.log("🔥 Trial expired → Downgrading");

                      await setDoc(userRef, {
                        tier: 'free',
                        credits: Math.max(data.credits || 0, 5), // safe
                        isTrial: false,
                        trialEndsAt: null,
                        updatedAt: serverTimestamp()
                      }, { merge: true });

                      return;
                    }
                  }

                  setProfile(data);
                }

                setProfileLoading(false);
              });

            } catch (err) {
              console.error("Profile sync error:", err);
              setProfileLoading(false);
            }

          } else {
            setProfile(null);
            setProfileLoading(false);
            if (unsubscribeProfile) unsubscribeProfile();
          }

          setLoading(false);
        });

      } catch (err: any) {
        setInitError(err.message);
        setLoading(false);
      }
    };

    setup();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  if (initError) {
    return <div>Error: {initError}</div>;
  }

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, profileLoading, isAuthReady, firebaseReady }}>
      {children}
    </FirebaseContext.Provider>
  );
}
import React from "react";

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("🔥 ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: "center" }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page</p>
        </div>
      );
    }

    return this.props.children;
  }
}
