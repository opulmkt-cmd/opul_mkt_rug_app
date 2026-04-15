import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { amount, currency, userId, type, value, tierId } = req.body;

    // 🔒 Validate required fields
    if (!amount || !userId || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("🔥 Creating payment for user:", userId);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency || "usd",

      // ✅ SAFE metadata (controlled structure)
      metadata: {
        userId: String(userId),
        type: String(type),
        value: value ? String(value) : "",
        tierId: tierId ? String(tierId) : "",
      },

      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (err: any) {
    console.error("❌ PaymentIntent error:", err);
    res.status(500).json({ error: err.message });
  }
}
