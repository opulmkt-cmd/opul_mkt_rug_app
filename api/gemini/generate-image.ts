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
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `A high-quality, professional rug design. Style: ${prompt}. The image should be top-down, no furniture, neutral floor.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64 = part.inlineData.data;
        return res.json({
          image: `data:image/png;base64,${base64}`,
        });
      }
    }

    throw new Error("No image generated");
  } catch (err: any) {
    console.error("Gemini Image Error:", err);
    res.status(500).json({ error: err.message });
  }
}
