import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Sparkles, 
  ShoppingBag, 
  FileText, 
  TrendingUp, 
  Clock, 
  LayoutGrid,
  ArrowUpRight,
  Loader2,
  Coins,
  Users,
  Database,
  Search,
  Filter,
  ChevronRight,
  Home,
  Palette,
  Eye,
  DollarSign,
  Package,
  Layers,
  CreditCard,
  Plus,
  CheckCircle2,
  RefreshCw,
  Shield
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { SavedDesign } from '../types';
import { useFirebase } from '../components/FirebaseProvider';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { storage } from '../lib/storage';
import { shopifyService } from '../services/shopifyService';
import { PRICING_TIERS } from '../constants';

const data = [
  { name: 'Mon', prompts: 4, rfq: 1 },
  { name: 'Tue', prompts: 7, rfq: 2 },
  { name: 'Wed', prompts: 5, rfq: 1 },
  { name: 'Thu', prompts: 12, rfq: 3 },
  { name: 'Fri', prompts: 8, rfq: 2 },
  { name: 'Sat', prompts: 15, rfq: 4 },
  { name: 'Sun', prompts: 9, rfq: 2 },
];

const COLORS = ['#EFBB76', '#000000', '#888888', '#CCCCCC'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthReady, profileLoading } = useFirebase();
  const [designs, setDesigns] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  
  // Admin State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPrompts, setAllPrompts] = useState<any[]>([]);
  const [allDesigns, setAllDesigns] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allSamples, setAllSamples] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activePrompts: 0,
    savedDesigns: 0
  });

  const isAdmin = profile?.role === 'admin';
  const hasVisualization = !!storage.getSmall('rug_selected_variation') || !!localStorage.getItem('rug_selected_image');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Auto-hide after 10 seconds
      setTimeout(() => setShowPaymentSuccess(false), 10000);
    }
  }, [location]);

  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const setupListeners = async () => {
      if (!isAuthReady) return;
      
      if (user) {
        setLoading(true);
        try {
          if (isAdmin) {
            // Admin listeners
            const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
              const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setAllUsers(usersData);
              setAdminStats(prev => ({ ...prev, totalUsers: usersData.length }));
            }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

            const promptsUnsub = onSnapshot(query(collection(db, 'prompts'), orderBy('createdAt', 'desc'), limit(50)), (snapshot) => {
              const promptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setAllPrompts(promptsData);
              setAdminStats(prev => ({ ...prev, activePrompts: promptsData.length }));
            }, (err) => handleFirestoreError(err, OperationType.GET, 'prompts'));

            const designsUnsub = onSnapshot(query(collection(db, 'designs'), orderBy('createdAt', 'desc'), limit(50)), (snapshot) => {
              const designsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setAllDesigns(designsData);
              setAdminStats(prev => ({ ...prev, savedDesigns: designsData.length }));
            }, (err) => handleFirestoreError(err, OperationType.GET, 'designs'));

            const ordersUnsub = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50)), (snapshot) => {
              const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setAllOrders(ordersData);
              setAdminStats(prev => ({ 
                ...prev, 
                totalRevenue: ordersData.reduce((acc, curr: any) => acc + (curr.amount || 0), 0) 
              }));
            }, (err) => handleFirestoreError(err, OperationType.GET, 'orders'));

            const samplesUnsub = onSnapshot(query(collection(db, 'sample_requests'), orderBy('createdAt', 'desc'), limit(50)), (snapshot) => {
              setAllSamples(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, (err) => handleFirestoreError(err, OperationType.GET, 'sample_requests'));

            const logsUnsub = onSnapshot(query(collection(db, 'webhook_logs'), orderBy('receivedAt', 'desc'), limit(20)), (snapshot) => {
              setWebhookLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, (err) => handleFirestoreError(err, OperationType.GET, 'webhook_logs'));

            unsubscribes.push(usersUnsub, promptsUnsub, designsUnsub, ordersUnsub, samplesUnsub, logsUnsub);
          }

          // User-specific listeners
          const userDesignsUnsub = onSnapshot(
            query(collection(db, 'designs'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10)),
            (snapshot) => {
              setDesigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (err) => handleFirestoreError(err, OperationType.GET, 'designs')
          );

          const userPromptsUnsub = onSnapshot(
            query(collection(db, 'prompts'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5)),
            (snapshot) => {
              setPrompts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (err) => handleFirestoreError(err, OperationType.GET, 'prompts')
          );

          const userOrdersUnsub = onSnapshot(
            query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5)),
            (snapshot) => {
              setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (err) => handleFirestoreError(err, OperationType.GET, 'orders')
          );

          unsubscribes.push(userDesignsUnsub, userPromptsUnsub, userOrdersUnsub);
          setLoading(false);

        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'dashboard');
          setLoading(false);
        }
      } else {
        // Guest fallback
        const saved = await storage.getLarge<any[]>('rug_saved_designs');
        setDesigns(saved || []);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user, isAuthReady, isAdmin]);

  const dashboardNav = [
    { label: 'DESIGN', path: '/design', icon: <Palette className="w-4 h-4" /> },
    { label: 'VISUALIZE', path: '/visualizer', icon: <Eye className="w-4 h-4" /> },
    { label: 'PRICING', path: '/design-detail', icon: <DollarSign className="w-4 h-4" /> },
    { label: 'CHECKOUT', path: '/checkout', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'COLLECTIONS', path: '/wishlist', icon: <Plus className="w-4 h-4" /> },
  ];

  const stats = [
    { label: 'Total Prompts', value: prompts.length.toString(), icon: <Sparkles className="w-5 h-5" />, trend: 'Real-time' },
    { label: 'Designs Saved', value: designs.length.toString(), icon: <LayoutGrid className="w-5 h-5" />, trend: 'Wishlist' },
    { label: 'Available Credits', value: profileLoading ? '...' : (profile?.credits?.toString() || '0'), icon: <Coins className="w-5 h-5" />, trend: 'Balance' },
    { label: 'Account Status', value: user ? 'Verified' : 'Guest', icon: <FileText className="w-5 h-5" />, trend: 'Profile' },
  ];

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Admin Credit Adjustment State
  const [adjustEmail, setAdjustEmail] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  const [shopifyStatus, setShopifyStatus] = useState<any>(null);
  const [isCheckingShopify, setIsCheckingShopify] = useState(false);

  const checkShopifyStatus = async () => {
    setIsCheckingShopify(true);
    try {
      const res = await fetch('/api/shopify/diagnostics');
      const data = await res.json();
      setShopifyStatus(data);
    } catch (err) {
      console.error("Failed to check Shopify status:", err);
    } finally {
      setIsCheckingShopify(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      checkShopifyStatus();
    }
  }, [isAdmin]);

  const refreshWebhookLogs = async () => {
    if (!isAdmin) return;
    setIsRefreshingLogs(true);
    try {
      const logsSnap = await getDocs(query(collection(db, 'webhook_logs'), orderBy('receivedAt', 'desc'), limit(20)));
      setWebhookLogs(logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Failed to refresh logs:", err);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch('/api/stripe/manual-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      const data = await response.json();
      if (data.success) {
        setSyncMessage(data.message);
      } else {
        setSyncMessage(data.error || "Sync failed.");
      }
    } catch (err: any) {
      setSyncMessage("Error connecting to server.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!user || !isAdmin) return;
    if (!adjustEmail || !adjustAmount) {
      alert("Please fill in email and amount");
      return;
    }
    setIsAdjusting(true);
    try {
      const response = await fetch('/api/admin/adjust-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.uid,
          targetEmail: adjustEmail,
          amount: adjustAmount,
          reason: adjustReason
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Success! New balance: ${data.newCredits}`);
        setAdjustEmail('');
        setAdjustAmount('');
        setAdjustReason('');
      } else {
        alert(data.error || "Adjustment failed.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleVerifyUpgrade = async () => {
    if (!user || !profile?.pendingUpgradeId) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const isPaid = await shopifyService.verifyUpgrade(profile.pendingUpgradeId);
      if (isPaid) {
        // Update user profile
        const targetTier = PRICING_TIERS.find(t => t.id === profile.pendingTierId) || PRICING_TIERS[1];
        await updateDoc(doc(db, 'users', user.uid), {
          tier: profile.pendingTierId,
          credits: (profile.credits || 0) + targetTier.credits,
          pendingUpgradeId: null,
          pendingTierId: null,
          updatedAt: serverTimestamp()
        });
        alert(`Success! Your account has been upgraded to ${targetTier.name}.`);
        window.location.reload();
      } else {
        setVerifyError("Payment not yet confirmed. Please ensure you've completed the Shopify checkout.");
      }
    } catch (err: any) {
      setVerifyError(err.message || "Failed to verify payment.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#EFBB76]" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-6 py-12"
    >
      {/* Payment Success Notification */}
      {showPaymentSuccess && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 p-8 bg-green-50 border border-green-200 rounded-[2.5rem] flex items-center justify-between gap-6 shadow-xl"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-green-900">Payment Successful!</h3>
              <p className="text-green-700/80 font-medium mb-4">Your credits/tier will be updated automatically in a few moments. Please refresh if you don't see the changes immediately.</p>
              
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-6 py-2 bg-green-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Sync Credits Now
                </button>
                {syncMessage && (
                  <span className="text-xs font-bold text-green-800">{syncMessage}</span>
                )}
                <button 
                  onClick={async () => {
                    if (!user) return;
                    try {
                      const res = await fetch(`/api/debug/user/${user.uid}`);
                      const data = await res.json();
                      console.log("Server Debug Info:", data);
                      alert(`Server sees you in: ${data.databaseId}\nCredits: ${data.data?.credits || 0}\nTier: ${data.data?.tier || 'free'}`);
                    } catch (e) {
                      alert("Debug failed");
                    }
                  }}
                  className="px-4 py-2 border border-green-600/30 text-green-800/60 rounded-full text-[8px] font-bold uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all"
                >
                  Debug Server Status
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowPaymentSuccess(false)}
            className="text-green-900/40 hover:text-green-900 transition-colors"
          >
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </motion.div>
      )}

      {/* Dashboard Navigation Bar */}
      <div className="mb-12 flex flex-wrap items-center justify-center gap-2 p-2 bg-black/5 rounded-[2rem] border border-black/5">
        {dashboardNav.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black tracking-widest transition-all ${
              location.pathname === item.path 
                ? 'bg-black text-white shadow-lg' 
                : 'text-black/60 hover:bg-black/10'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      {/* Pending Upgrade Notice */}
      {profile?.pendingUpgradeId && (
        <div className="mb-12 p-8 bg-[#EFBB76]/10 border border-[#EFBB76]/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#EFBB76] rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold">Upgrade Pending</h3>
              <p className="text-sm text-black/60">We're waiting for your Shopify payment confirmation.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={handleVerifyUpgrade}
              disabled={isVerifying}
              className="px-8 py-3 bg-[#EFBB76] text-black font-black text-xs rounded-full hover:bg-[#DBA762] transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Verify Payment
            </button>
            {verifyError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{verifyError}</p>}
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className="space-y-12">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-serif font-bold text-black mb-2">Admin Control Center</h1>
              <p className="text-black/40 text-sm font-bold uppercase tracking-widest">Global platform oversight & user data</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-[#EFBB76]/10 text-[#EFBB76] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#EFBB76]/20">
                <Users className="w-4 h-4" /> {allUsers.length} Users
              </div>
              <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                <Database className="w-4 h-4" /> System Healthy
              </div>
            </div>
          </header>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Users', value: adminStats.totalUsers, icon: <Users />, color: 'text-blue-600' },
              { label: 'Total Revenue', value: `$${adminStats.totalRevenue}`, icon: <DollarSign />, color: 'text-green-600' },
              { label: 'Active Prompts', value: adminStats.activePrompts, icon: <Sparkles />, color: 'text-[#EFBB76]' },
              { label: 'Saved Designs', value: adminStats.savedDesigns, icon: <Palette />, color: 'text-purple-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-black/10 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">{stat.label}</h3>
                <p className="text-3xl font-serif font-bold text-black">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Prompts (Admin) */}
            <div className="bg-white p-8 rounded-[3rem] border border-black/10 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#EFBB76]" /> Global Prompt Stream
              </h3>
              <div className="space-y-4">
                {allPrompts.map((p) => (
                  <div key={p.id} className="p-4 bg-black/5 rounded-2xl border border-black/5 flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-black/80 mb-1 italic">"{p.text}"</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest">User: {p.userId.slice(0, 8)}...</span>
                        <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest">•</span>
                        <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest">
                          {p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Designs (Admin) */}
            <div className="bg-white p-8 rounded-[3rem] border border-black/10 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#EFBB76]" /> Recent Creations
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {allDesigns.slice(0, 6).map((design) => (
                  <div key={design.id} className="relative group rounded-2xl overflow-hidden aspect-square bg-black/5">
                    <img src={design.imageUrl} alt={design.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-[10px] font-bold text-white mb-1">{design.name}</p>
                      <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">User: {design.userId.slice(0, 8)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Users List */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/10 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black/5 pb-4">User Directory</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {allUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#EFBB76]/10 flex items-center justify-center font-bold text-[#EFBB76]">
                        {u.displayName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{u.displayName || 'Anonymous'}</p>
                        <p className="text-[10px] text-black/40">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#EFBB76]">{u.tier || 'Free'}</p>
                      <p className="text-[10px] text-black/40">{u.credits} Credits</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompts Tracking */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/10 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black/5 pb-4">Recent Prompts</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {allPrompts.map((p: any) => (
                  <div key={p.id} className="p-4 bg-black/5 rounded-2xl space-y-2">
                    <p className="text-xs font-medium italic">"{p.text}"</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-black/20">
                        {p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'Recent'}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#EFBB76]">
                        UID: {p.userId?.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Designs */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/10 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black/5 pb-4">Global Designs</h3>
              <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {allDesigns.map((d: any) => (
                  <div key={d.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-black/10">
                    <img src={d.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-[8px] text-white font-bold uppercase tracking-widest mb-1">{d.config?.construction}</p>
                      <p className="text-[8px] text-[#EFBB76] font-bold uppercase tracking-widest">By: {d.userId?.slice(0, 8)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deposits */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/10 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black/5 pb-4">Deposits & Orders</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {/* Orders/Deposits */}
                {allOrders.map((o: any) => (
                  <div key={o.id} className="p-4 bg-black/5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-black/40" />
                      <div>
                        <p className="text-xs font-bold">{o.type}</p>
                        <p className="text-[10px] text-black/40">${o.amount} - {o.status}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-black/20">
                      {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <header className="mb-12 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-serif font-bold text-black mb-2">Welcome Back, Designer</h1>
              <p className="text-black/40 text-sm font-bold uppercase tracking-widest">Overview of your creative activity</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-black/5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                <Clock className="w-4 h-4 text-[#EFBB76]" /> Last Sync: Just Now
              </div>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-8 rounded-3xl border border-black/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-[#EFBB76]">
                    {stat.icon}
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-black/5 text-black/40'}`}>
                    {stat.trend}
                  </span>
                </div>
                <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1">{stat.label}</h3>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-serif font-bold text-black">{stat.value}</p>
                  
                  {stat.label === 'Available Credits' && (
                    <div className="flex flex-col gap-1">
                      {profile?.tier === 'free' ? (
                        <button 
                          onClick={() => navigate('/checkout', { state: { tier: 'creator' } })}
                          className="px-3 py-1.5 bg-[#EFBB76] text-black text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-[#DBA762] transition-all shadow-sm"
                        >
                          Upgrade Now
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate('/credits')}
                          className="px-3 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-black/80 transition-all shadow-sm"
                        >
                          Add Credits
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Profile & Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Profile Card */}
            <div className="bg-white p-8 rounded-[3rem] border border-black/10 shadow-sm flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-black/5 rounded-full overflow-hidden mb-6 border-4 border-[#EFBB76]/20">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#EFBB76] text-black font-black text-2xl">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-serif font-bold text-black mb-1">{user?.displayName || 'Designer'}</h3>
              <p className="text-xs text-black/40 font-bold mb-6">{user?.email || 'Guest User'}</p>
              
              <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-black/5">
                <div>
                  <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest block mb-1">Member Since</span>
                  <p className="text-[10px] font-bold text-black">Mar 2026</p>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest block mb-1">Tier</span>
                  <p className="text-[10px] font-bold text-[#EFBB76] uppercase">{profile?.tier || 'FREE'}</p>
                </div>
              </div>
            </div>

            {/* Activity Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-black/10 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#EFBB76]" /> Weekly Activity
                </h3>
                <select className="bg-black/5 border-none rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorPrompts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EFBB76" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EFBB76" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="prompts" 
                      stroke="#EFBB76" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPrompts)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Prompts */}
            <div className="bg-white p-8 rounded-[3rem] border border-black/10 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Your Prompts</h3>
              <div className="space-y-4">
                {prompts.length > 0 ? (
                  prompts.map((p) => (
                    <div key={p.id} className="p-4 bg-black/5 rounded-2xl border border-black/5">
                      <p className="text-[10px] font-bold text-black/60 line-clamp-2 italic mb-2">"{p.text}"</p>
                      <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest">
                        {p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-xs font-bold text-black/20 uppercase tracking-widest">No prompts yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Wishlist */}
            <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-black/10 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Your Wishlist</h3>
              <div className="space-y-6">
                {designs.length > 0 ? (
                  designs.slice(0, 4).map((design) => (
                    <div 
                      key={design.id} 
                      className="flex items-start gap-4 group"
                    >
                      <div 
                        onClick={() => navigate(`/design-detail/${design.id}`)}
                        className="w-12 h-12 bg-black/5 rounded-xl overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-[#EFBB76] transition-all cursor-pointer"
                      >
                        <img 
                          src={design.imageUrl} 
                          alt={design.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 border-b border-black/5 pb-4">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-black/80 line-clamp-1">{design.name}</p>
                        </div>
                        <span className="text-[8px] font-bold text-black/20 uppercase tracking-widest">
                          {design.createdAt ? new Date(design.createdAt).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <ArrowUpRight 
                        onClick={() => navigate(`/design-detail/${design.id}`)}
                        className="w-4 h-4 text-black/10 group-hover:text-[#EFBB76] transition-colors cursor-pointer" 
                      />
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-xs font-bold text-black/20 uppercase tracking-widest">No designs yet</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => navigate('/wishlist')}
                className="w-full mt-8 py-3 bg-black/5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 transition-colors"
              >
                View All Designs
              </button>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-[3rem] border border-black/10 shadow-sm overflow-hidden mb-12">
            <div className="p-8 border-b border-black/5">
              <h3 className="text-sm font-bold uppercase tracking-widest">Recent Order Updates</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/5">
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Order ID</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Date</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-black/40">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-black/[0.02] transition-colors">
                        <td className="px-8 py-6 text-xs font-bold">#{order.id.slice(-6).toUpperCase()}</td>
                        <td className="px-8 py-6 text-xs text-black/40 font-bold">
                          {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            order.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-[#EFBB76]/10 text-[#EFBB76]'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-[#EFBB76]">{order.type}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-xs font-bold text-black/20 uppercase tracking-widest">
                        No active orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div className="space-y-8">
              <div className="bg-black text-white rounded-[3rem] p-12 shadow-2xl">
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-12 bg-[#EFBB76] rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif font-bold">Admin Control Center</h2>
                    <p className="text-white/60 text-sm">Manage users and monitor system health</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Manual Credit Adjustment */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#EFBB76]">Manual Credit Adjustment</h3>
                    <div className="space-y-4">
                      <input 
                        type="email" 
                        placeholder="User Email"
                        value={adjustEmail}
                        onChange={(e) => setAdjustEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#EFBB76] transition-colors"
                      />
                      <input 
                        type="number" 
                        placeholder="Amount (e.g. 50 or -10)"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#EFBB76] transition-colors"
                      />
                      <input 
                        type="text" 
                        placeholder="Reason (optional)"
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#EFBB76] transition-colors"
                      />
                      <button 
                        onClick={handleAdjustCredits}
                        disabled={isAdjusting}
                        className="w-full py-4 bg-[#EFBB76] text-black rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#EFBB76]/90 transition-all disabled:opacity-50"
                      >
                        {isAdjusting ? "Processing..." : "Apply Adjustment"}
                      </button>
                    </div>
                  </div>

                  {/* Test Fulfillment Logic */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#EFBB76]">Test Fulfillment Logic</h3>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                      <p className="text-[10px] text-white/60">Simulate a successful payment to test if credits update correctly. This bypasses Stripe and tests the database logic directly.</p>
                      <button 
                        onClick={async () => {
                          if (!user) return;
                          if (!confirm("This will simulate a 20-credit upgrade for your account. Continue?")) return;
                          try {
                            const res = await fetch('/api/admin/test-fulfillment', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                adminId: user.uid,
                                userId: user.uid,
                                type: 'tier',
                                value: '20',
                                tierId: 'creator'
                              })
                            });
                            const data = await res.json();
                            if (data.success) alert("Test success! Refresh to see credits.");
                            else alert(data.error);
                          } catch (e) {
                            alert("Test failed");
                          }
                        }}
                        className="w-full py-3 border border-[#EFBB76] text-[#EFBB76] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#EFBB76] hover:text-black transition-all"
                      >
                        Simulate 20 Credit Upgrade
                      </button>
                    </div>
                  </div>

                  {/* System Health / Webhook Status */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-[#EFBB76]">Shopify Configuration</h3>
                      <button 
                        onClick={checkShopifyStatus}
                        disabled={isCheckingShopify}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isCheckingShopify ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
                      {shopifyStatus ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Domain</span>
                            <span className={`text-[10px] font-bold ${shopifyStatus.domain ? 'text-green-500' : 'text-red-500'}`}>
                              {shopifyStatus.domain || 'Not Set'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Admin Token</span>
                            <span className={`text-[10px] font-bold ${shopifyStatus.hasAdminToken ? 'text-green-500' : 'text-red-500'}`}>
                              {shopifyStatus.hasAdminToken ? `Configured (${shopifyStatus.adminTokenPrefix}...)` : 'Missing'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Storefront Token</span>
                            <span className={`text-[10px] font-bold ${shopifyStatus.hasStorefrontToken ? 'text-green-500' : 'text-red-500'}`}>
                              {shopifyStatus.hasStorefrontToken ? `Configured (${shopifyStatus.storefrontTokenPrefix}...)` : 'Missing'}
                            </span>
                          </div>
                          
                          {!shopifyStatus.hasStorefrontToken && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest leading-relaxed">
                                Action Required: Set SHOPIFY_STOREFRONT_ACCESS_TOKEN in Settings.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-white/40 italic text-center py-4">Checking Shopify status...</p>
                      )}
                    </div>
                  </div>

                  {/* System Health / Webhook Status */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-[#EFBB76]">Stripe Webhook Health</h3>
                      <button 
                        onClick={refreshWebhookLogs}
                        disabled={isRefreshingLogs}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshingLogs ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                      <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Recent Events</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[8px] font-bold uppercase tracking-widest text-green-500">Live Monitoring</span>
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                        {webhookLogs.length > 0 ? (
                          webhookLogs.map((log) => (
                            <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] font-bold text-[#EFBB76]">{log.type}</p>
                                  <p className="text-[8px] text-white/40">{new Date(log.receivedAt).toLocaleString()}</p>
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                  log.status === 'success' ? 'bg-green-500/20 text-green-500' : 
                                  log.status === 'processing' ? 'bg-blue-500/20 text-blue-500' :
                                  log.status === 'ignored' ? 'bg-white/10 text-white/40' :
                                  'bg-red-500/20 text-red-500'
                                }`}>
                                  {log.status}
                                </span>
                              </div>
                              
                              {log.error && (
                                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                  <p className="text-[8px] text-red-400 font-mono">Error: {log.error}</p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-black/20 rounded-lg">
                                  <p className="text-[6px] uppercase text-white/20 mb-1">User ID</p>
                                  <p className="text-[8px] font-mono text-white/60 truncate">{log.metadata?.userId || 'N/A'}</p>
                                </div>
                                <div className="p-2 bg-black/20 rounded-lg">
                                  <p className="text-[6px] uppercase text-white/20 mb-1">Database</p>
                                  <p className="text-[8px] font-mono text-white/60 truncate">{log.databaseId || 'default'}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-white/40 italic text-center py-8">No webhook events recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
