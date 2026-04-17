import { db } from "../lib/firebaseAdmin";

// 🔥 ADD THIS HELPER
async function handleTrialExpiry(userRef, userData) {
  if (!userData?.isTrial || !userData?.trialEndsAt) return userData;

  const now = new Date();
  const trialEnd = new Date(userData.trialEndsAt);

  if (now > trialEnd && userData.tier === "creator") {
    const updated = {
      tier: "free",
      credits: 5,
      isTrial: false,
      trialEndsAt: null,
      updatedAt: new Date().toISOString(),
    };

    await userRef.update(updated);
    return { ...userData, ...updated };
  }

  return userData;
}

export default async function handler(req, res) {
  const { action, userId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    let user = userDoc.data();

    // 🔥 ADD THIS LINE (CRITICAL)
    user = await handleTrialExpiry(userRef, user);

    // =====================================================
    // 💰 GET USER CREDITS
    // =====================================================
    if (action === "credits") {
      return res.json({
        credits: user?.credits || 0,
      });
    }

    // =====================================================
    // 👤 GET FULL USER PROFILE
    // =====================================================
    if (action === "profile") {
      return res.json(user);
    }

    // =====================================================
    return res.status(404).json({ error: "Invalid action" });

  } catch (err: any) {
    console.error("❌ User API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
