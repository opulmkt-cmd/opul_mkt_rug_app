import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { promoCode, userId } = req.body;

  if (!promoCode || !userId) {
    return res.status(400).json({ error: "promoCode and userId required" });
  }

  try {
    if (!adminDb) {
      return res.status(500).json({ error: "Database not initialized" });
    }

    const db = adminDb;

    // 🔑 Define promo codes (you can move this to Firestore later)
    const PROMOS: any = {
      FREE20: { credits: 20 },
      DEMO10: { credits: 10 },
    };

    const promo = PROMOS[promoCode.toUpperCase()];

    if (!promo) {
      return res.status(400).json({ error: "Invalid promo code" });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // ✅ Prevent reuse
    if (userData?.promoUsed) {
      return res.status(400).json({ error: "Promo already used" });
    }

    const creditsToAdd = promo.credits;

    await userRef.update({
      credits: (userData?.credits || 0) + creditsToAdd,
      promoUsed: true,
      updatedAt: new Date().toISOString()
    });

    // optional log
    await db.collection('orders').add({
      userId,
      type: 'Promo Redemption',
      credits: creditsToAdd,
      createdAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      creditsAdded: creditsToAdd
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
