import { generateRugImage } from "../../lib/gemini";
import { db } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
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

    // ✅ Gmail-based admin list (same as Firestore rules)
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

      // ✅ Deduct credit FIRST
      await userRef.update({
        credits: user.credits - 1,
        updatedAt: new Date().toISOString(),
      });
    }

    // 🎨 Generate image
    const image = await generateRugImage(prompt);

    // ✅ Save design
    await db.collection("designs").add({
      userId,
      name: "Generated Rug",
      imageUrl: image,
      prompt,
      createdAt: new Date().toISOString(),
    });

    return res.json({ image });

  } catch (err: any) {
    console.error("Generation Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
