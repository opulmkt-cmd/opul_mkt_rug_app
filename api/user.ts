import { adminDb } from "../../lib/firebaseAdmin"

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    if (!adminDb) {
      return res.status(500).json({ error: "DB not initialized" });
    }

    const userDoc = await adminDb
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      credits: userDoc.data()?.credits || 0,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
