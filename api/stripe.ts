import Stripe from "stripe";
import { buffer } from "micro";
import { db } from "../lib/firebaseAdmin.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // =====================================================
    // 🔥 1. CREATE PAYMENT INTENT
    // =====================================================
    if (action === "create-payment-intent") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST" });
      }

      const { amount, metadata } = req.body;

      if (!amount || !metadata?.userId || !metadata?.type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        metadata: {
          userId: String(metadata.userId),
          type: String(metadata.type),
          value: metadata.value ? String(metadata.value) : "",
          tierId: metadata.tierId ? String(metadata.tierId) : "",
        },
        automatic_payment_methods: { enabled: true },
      });

      return res.json({ clientSecret: paymentIntent.client_secret });
    }

    // =====================================================
    // 🎟️ 2. PROMO CODE (TRIAL)
    // =====================================================
    if (action === "redeem-promo") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST" });
      }

      const { promoCode, userId } = req.body;

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();

      if (userData?.promoUsed) {
        return res.status(400).json({ error: "Promo already used" });
      }

      const PROMOS = {
        FREE20: 20,
        DEMO10: 10,
      };

      const credits = PROMOS[promoCode.toUpperCase()];

      if (!credits) {
        return res.status(400).json({ error: "Invalid promo code" });
      }

      // 🔥 TRIAL
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      await userRef.update({
        credits: (userData?.credits || 0) + credits,
        promoUsed: true,
        tier: "creator",
        isTrial: true,
        trialEndsAt: trialEndsAt.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 🧾 LOG
      await db.collection("orders").add({
        userId,
        type: "Promo Trial",
        status: "Paid",
        amount: 0,
        metadata: {
          promoCode,
          credits,
          trialEndsAt: trialEndsAt.toISOString(),
        },
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        creditsAdded: credits,
        trialEndsAt: trialEndsAt.toISOString(),
      });
    }

    // =====================================================
    // 🔥 3. STRIPE WEBHOOK (PAID USERS)
    // =====================================================
    if (action === "webhook") {
      let event;

      try {
        const sig = req.headers["stripe-signature"];
        const rawBody = await buffer(req);

        event = stripe.webhooks.constructEvent(
          rawBody,
          sig!,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch (err: any) {
        console.error("Signature error:", err.message);
        return res.status(200).json({ received: true });
      }

      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        const { userId, type, value, tierId } = pi.metadata || {};

        const userRef = db.collection("users").doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) return res.status(200).json({ received: true });

        const user = userSnap.data();

        let updates: any = {
          updatedAt: new Date().toISOString(),
        };

        if (type === "tier") {
          updates.tier = tierId || "creator";
          updates.credits = (user.credits || 0) + 20;

          // 🔥 IMPORTANT (paid users)
          updates.isTrial = false;
          updates.trialEndsAt = null;
        }

        if (type === "credits") {
          updates.credits = (user.credits || 0) + parseInt(value || "0");
        }

        await userRef.update(updates);

        await db.collection("orders").add({
          userId,
          type: "Stripe Payment",
          status: "Paid",
          amount: pi.amount / 100,
          stripePaymentIntentId: pi.id,
          createdAt: new Date().toISOString(),
        });
      }

      return res.status(200).json({ received: true });
    }

    return res.status(404).json({ error: "Invalid action" });

  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
