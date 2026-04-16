import { db } from "../lib/firebaseAdmin";

export default async function handler(req, res) {
  const { action, userId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // =====================================================
    // 💰 GET USER CREDITS
    // =====================================================
    if (action === "credits") {
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        credits: userDoc.data()?.credits || 0,
      });
    }

    // =====================================================
    // 👤 GET FULL USER PROFILE (optional)
    // =====================================================
    if (action === "profile") {
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(userDoc.data());
    }

    // =====================================================
    return res.status(404).json({ error: "Invalid action" });

  } catch (err: any) {
    console.error("❌ User API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
