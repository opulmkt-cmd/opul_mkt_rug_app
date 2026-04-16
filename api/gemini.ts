import { analyzeComplexity, generateRugImage } from "../lib/gemini";
import { db } from "../lib/firebaseAdmin";

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // =====================================================
    // 🧠 1. ANALYZE PROMPT
    // =====================================================
    if (action === "analyze") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST" });
      }

      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const result = await analyzeComplexity(prompt);
      return res.json(result);
    }

    // =====================================================
    // 🎨 2. GENERATE IMAGE (WITH CREDITS)
    // =====================================================
    if (action === "generate-image") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST" });
      }

      const { prompt, userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "UserId required" });
      }

      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userSnap.data();

      // ✅ Admin emails (no credit deduction)
      const adminEmails = [
        "aimanaimlengineer@gmail.com",
        "adilabbas812@gmail.com",
        "aimanmaniyar20@gmail.com",
        "adilabbas@gmail.com",
        "aimanmaniyar28@gmail.com"
      ];

      const isAdmin = adminEmails.includes(user.email);

      // 🔥 CREDIT LOGIC
      if (!isAdmin) {
        if (!user.credits || user.credits <= 0) {
          return res.status(400).json({ error: "No credits left" });
        }

        // deduct credit BEFORE generation
        await userRef.update({
          credits: user.credits - 1,
          updatedAt: new Date().toISOString(),
        });
      }

      // 🎨 Generate image
      const image = await generateRugImage(prompt);

      // 💾 Save design
      await db.collection("designs").add({
        userId,
        name: "Generated Rug",
        imageUrl: image,
        prompt,
        createdAt: new Date().toISOString(),
      });

      return res.json({ image });
    }

    // =====================================================
    return res.status(404).json({ error: "Invalid action" });

  } catch (err: any) {
    console.error("❌ Gemini API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
