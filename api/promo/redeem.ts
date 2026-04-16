import { adminDb } from "../../firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const { promoCode, userId } = req.body;

  if (!promoCode || !userId) {
    return res.status(400).json({ error: "promoCode & userId required" });
  }

  try {
    if (!adminDb) {
      return res.status(500).json({ error: "DB not initialized" });
    }

    const db = adminDb;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // ❌ prevent reuse
    if (userData?.promoUsed) {
      return res.status(400).json({ error: "Promo already used" });
    }

    // ✅ simple promo system
    const PROMOS = {
      FREE20: 20,
      DEMO10: 10,
    };

    const creditsToAdd = PROMOS[promoCode.toUpperCase()];

    if (!creditsToAdd) {
      return res.status(400).json({ error: "Invalid promo code" });
    }

    await userRef.update({
      credits: (userData?.credits || 0) + creditsToAdd,
      promoUsed: true,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      creditsAdded: creditsToAdd,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
