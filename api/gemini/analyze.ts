import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { prompt } = req.body;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this rug design prompt: "${prompt}".
      Return JSON with:
      - complexity
      - reasoning
      - rejected
      - rejectionReason`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text);

    res.json(result);
  } catch (err: any) {
    console.error("Gemini Analyze Error:", err);
    res.status(500).json({ error: err.message });
  }
}
