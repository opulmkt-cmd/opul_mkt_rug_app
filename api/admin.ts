import { db } from "../lib/firebaseAdmin";

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // =====================================================
    // 🔐 ADMIN AUTH CHECK
    // =====================================================
    const { adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // =====================================================
    // 🎟️ CREATE PROMO CODE
    // =====================================================
    if (action === "create-promo") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST" });
      }

      const { code, credits, maxUses, expiryDate } = req.body;

      if (!code || !credits) {
        return res.status(400).json({ error: "code & credits required" });
      }

      const promoRef = db.collection("promo_codes").doc(code.toUpperCase());
      const existing = await promoRef.get();

      if (existing.exists) {
        return res.status(400).json({ error: "Promo already exists" });
      }

      await promoRef.set({
        code: code.toUpperCase(),
        credits: Number(credits),
        maxUses: maxUses || 100,
        usedCount: 0,
        isActive: true,
        expiryDate: expiryDate || null,
        createdAt: new Date().toISOString(),
      });

      return res.json({ success: true });
    }

    // =====================================================
    // 💰 ADJUST USER CREDITS
    // =====================================================
    if (action === "adjust-credits") {
      const { userId, amount } = req.body;

      if (!userId || !amount) {
        return res.status(400).json({ error: "userId & amount required" });
      }

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userDoc.data();

      await userRef.update({
        credits: (user.credits || 0) + Number(amount),
        updatedAt: new Date().toISOString(),
      });

      return res.json({ success: true });
    }

    // =====================================================
    return res.status(404).json({ error: "Invalid action" });

  } catch (err: any) {
    console.error("❌ Admin API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
