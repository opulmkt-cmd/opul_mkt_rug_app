import { adminDb } from "../../firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST method" });
  }

  const { code, credits, maxUses, expiryDate, adminSecret } = req.body;

  // 🔒 Basic admin protection (IMPORTANT)
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (!code || !credits) {
    return res.status(400).json({ error: "code & credits are required" });
  }

  try {
    if (!adminDb) {
      return res.status(500).json({ error: "Database not initialized" });
    }

    const db = adminDb;

    const promoRef = db.collection("promo_codes").doc(code.toUpperCase());
    const existing = await promoRef.get();

    if (existing.exists) {
      return res.status(400).json({ error: "Promo code already exists" });
    }

    await promoRef.set({
      code: code.toUpperCase(),
      credits: Number(credits),
      maxUses: maxUses || 100, // default limit
      usedCount: 0,
      isActive: true,
      expiryDate: expiryDate || null,
      createdAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: "Promo code created successfully"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
