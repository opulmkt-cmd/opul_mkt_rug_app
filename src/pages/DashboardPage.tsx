import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Clock, Coins } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFirebase } from '../components/FirebaseProvider';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, profile, isAuthReady, profileLoading } = useFirebase();

  const [designs, setDesigns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // =====================================================
  // ✅ PAYMENT SUCCESS FLAG
  // =====================================================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);

      setTimeout(() => setShowPaymentSuccess(false), 8000);
    }
  }, [location]);

  // =====================================================
  // ✅ REALTIME USER DATA
  // =====================================================
  useEffect(() => {
    if (!isAuthReady || !user) return;

    setLoading(true);

    const unsubDesigns = onSnapshot(
      query(collection(db, 'designs'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10)),
      (snap) => setDesigns(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5)),
      (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    setLoading(false);

    return () => {
      unsubDesigns();
      unsubOrders();
    };
  }, [user, isAuthReady]);

  // =====================================================
  // 🔥 AUTO TRIAL EXPIRY HANDLER
  // =====================================================
  useEffect(() => {
    if (!profile || !user) return;

    if (profile.isTrial && profile.trialEndsAt) {
      const now = Date.now();
      const expiry = new Date(profile.trialEndsAt).getTime();

      if (now > expiry) {
        fetch('/api/user/expire-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid })
        });
      }
    }
  }, [profile, user]);

  if (loading || profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  // =====================================================
  // 🧠 TRIAL DAYS LEFT
  // =====================================================
  let trialDays = 0;
  if (profile.isTrial && profile.trialEndsAt) {
    const diff = new Date(profile.trialEndsAt).getTime() - Date.now();
    trialDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-6 py-12"
    >

      {/* ✅ PAYMENT SUCCESS */}
      {showPaymentSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-xl text-center font-semibold">
          Payment successful! Your credits/tier will update shortly.
        </div>
      )}

      {/* 👋 HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">
          Welcome, {profile.displayName || "User"}
        </h1>
        <p className="text-gray-500">Your dashboard overview</p>
      </div>

      {/* 📊 STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        {/* Credits */}
        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-xs text-gray-400">Credits</p>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="w-5 h-5" />
            {profile.credits || 0}
          </h2>

          {profile.credits <= 0 && (
            <p className="text-red-500 text-xs mt-2">
              No credits left. Buy more.
            </p>
          )}
        </div>

        {/* Tier */}
        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-xs text-gray-400">Tier</p>
          <h2 className="text-3xl font-bold capitalize">
            {profile.tier}
          </h2>
        </div>

        {/* Trial */}
        <div className="p-6 bg-white rounded-xl shadow">
          <p className="text-xs text-gray-400">Trial</p>

          {profile.isTrial ? (
            <h2 className="text-xl font-bold text-green-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {trialDays} days left
            </h2>
          ) : (
            <h2 className="text-gray-400">No active trial</h2>
          )}
        </div>
      </div>

      {/* 🚀 ACTIONS */}
      <div className="flex flex-wrap gap-4 mb-10">

        <button
          onClick={() => navigate('/generate')}
          className="bg-black text-white px-6 py-3 rounded-lg"
        >
          Generate Design
        </button>

        <button
          onClick={() =>
            navigate('/checkout', {
              state: { type: 'credits', amount: 5, credits: 20 }
            })
          }
          className="bg-yellow-400 px-6 py-3 rounded-lg"
        >
          Buy Credits
        </button>

        {profile.tier === 'free' && (
          <button
            onClick={() =>
              navigate('/checkout', { state: { tier: 'creator' } })
            }
            className="bg-purple-600 text-white px-6 py-3 rounded-lg"
          >
            Upgrade to Creator
          </button>
        )}
      </div>

      {/* 🎨 RECENT DESIGNS */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Recent Designs</h2>

        {designs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {designs.map((d) => (
              <img
                key={d.id}
                src={d.imageUrl}
                className="rounded-lg"
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No designs yet</p>
        )}
      </div>

      {/* 🧾 ORDERS */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Orders</h2>

        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="p-4 border rounded-lg flex justify-between"
              >
                <span>{o.type}</span>
                <span className="text-gray-500">
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No orders yet</p>
        )}
      </div>

    </motion.div>
  );
};
