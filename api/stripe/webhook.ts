import Stripe from "stripe";
import { buffer } from "micro";
import { db } from "../../lib/firebaseAdmin";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

 if (event.type === "payment_intent.succeeded") {
  const pi = event.data.object;
  const { userId, type, value, tierId } = pi.metadata;

  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) return;

  const user = userSnap.data();

  let updates: any = {
    updatedAt: new Date().toISOString(),
  };

  
  if (type === "credits") {
    updates.credits = (user.credits || 0) + parseInt(value || "0");
  }

  
  if (type === "tier") {
    updates.tier = tierId;
    updates.credits = (user.credits || 0) + parseInt(value || "0");
  }

  await userRef.update(updates);

  
  await db.collection("orders").add({
    userId,
    type: type === "credits" ? "Credit Top-up" : "Plan Upgrade",
    status: "Paid",
    amount: pi.amount / 100,
    stripePaymentIntentId: pi.id,
    createdAt: new Date().toISOString(),
  });
}
