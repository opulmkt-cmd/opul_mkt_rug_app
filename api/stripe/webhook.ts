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
    const pi = event.data.object as any;
    const { userId, type, value, tierId } = pi.metadata || {};

    if (!userId) return res.status(200).send("No userId");

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.status(200).send("User not found");

    const data = userDoc.data();
    const updates: any = { updatedAt: new Date().toISOString() };

    if (type === "credits") {
      updates.credits = (data?.credits || 0) + parseInt(value || "0");
    }

    if (type === "tier") {
      updates.tier = tierId;
      updates.credits = (data?.credits || 0) + parseInt(value || "0");
    }

    await userRef.update(updates);

    await db.collection("orders").add({
      userId,
      type,
      amount: pi.amount / 100,
      createdAt: new Date().toISOString(),
    });
  }

  res.status(200).send("OK");
}
