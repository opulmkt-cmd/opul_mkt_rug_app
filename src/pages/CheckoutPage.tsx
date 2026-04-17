import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFirebase } from '../components/FirebaseProvider';
import { PRICING_TIERS } from '../constants';
import { shopifyService } from '../services/shopifyService';
import { stripeService } from '../services/stripeService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '../components/StripePaymentForm';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useFirebase();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isDeposit = location.state?.type === 'deposit';
  const isCredits = location.state?.type === 'credits';

  const creditAmount = location.state?.amount || 5;
  const creditCount = location.state?.credits || 20;

  const targetTierId = location.state?.tier;
  const targetTier = PRICING_TIERS.find(t => t.id === targetTierId);

  const config = location.state?.config;
  const selectedImage = location.state?.image;

  // =====================================================
  // 🔥 STRIPE: CREATE PAYMENT INTENT
  // =====================================================
  useEffect(() => {
    if (!user) return;

    // 👉 ONLY for Stripe cases
    if (isCredits || targetTier) {
      const amount = targetTier ? targetTier.price : creditAmount;

      const metadata = isCredits
        ? { userId: user.uid, type: 'credits', value: creditCount.toString() }
        : { userId: user.uid, type: 'tier', tierId: targetTier?.id };

      stripeService.createPaymentIntent(amount, metadata)
        .then(res => setClientSecret(res.clientSecret))
        .catch(err => setError(err.message));
    }

  }, [user, isCredits, targetTier]);

  // =====================================================
  // 🛒 SHOPIFY: PRODUCTS ONLY
  // =====================================================
  const handleShopifyCheckout = async () => {
    try {
      setIsProcessing(true);

      const checkoutUrl = await shopifyService.createDynamicCheckout({
        title: "Custom Rug",
        price: location.state?.amount || 50,
        imageUrl: selectedImage || '',
        email: user?.email || '',
        attributes: [],
        type: 'product',
      });

      if (!checkoutUrl) throw new Error("Shopify checkout failed");

      window.location.href = checkoutUrl;

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // =====================================================
  // 🎨 UI
  // =====================================================

  return (
    <div className="max-w-4xl mx-auto py-16 px-6">

      <h1 className="text-3xl font-bold mb-8 text-center">
        Checkout
      </h1>

      {/* ========================================= */}
      {/* 🔥 STRIPE SECTION */}
      {/* ========================================= */}
      {(isCredits || targetTier) && (
        <div className="bg-white p-8 rounded-2xl shadow">

          <h2 className="text-xl font-bold mb-4">
            {targetTier ? "Upgrade Plan" : "Buy Credits"}
          </h2>

          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm
                amount={targetTier ? targetTier.price : creditAmount}
                onSuccess={() => navigate('/dashboard')}
                onError={(msg) => setError(msg)}
              />
            </Elements>
          ) : (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin" />
            </div>
          )}

        </div>
      )}

      {/* ========================================= */}
      {/* 🛒 SHOPIFY SECTION */}
      {/* ========================================= */}
      {(isDeposit || (!isCredits && !targetTier && config)) && (
        <div className="bg-white p-8 rounded-2xl shadow text-center">

          <h2 className="text-xl font-bold mb-4">
            Complete Your Purchase
          </h2>

          <button
            onClick={handleShopifyCheckout}
            disabled={isProcessing}
            className="bg-black text-white px-6 py-3 rounded-lg"
          >
            {isProcessing ? "Redirecting..." : "Proceed to Checkout"}
          </button>

        </div>
      )}

      {/* ========================================= */}
      {/* ❌ ERROR */}
      {/* ========================================= */}
      {error && (
        <p className="text-red-500 mt-6 text-center">
          {error}
        </p>
      )}

    </div>
  );
};
