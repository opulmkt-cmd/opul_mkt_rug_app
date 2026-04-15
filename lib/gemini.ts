import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});


export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (
      retries > 0 &&
      (error.status === 503 ||
        error.message?.includes("503") ||
        error.message?.includes("high demand"))
    ) {
      console.warn(
        `Gemini 503 → retrying in ${delay}ms (${retries} left)`
      );
      await new Promise((r) => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// ✅ Image generation (same as yours)
export const generateRugImage = async (prompt: string) => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `A high-quality, professional rug design. Style: ${prompt}. The image should be a top-down view of a rectangular rug on a neutral floor. No people, no furniture.`,
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
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated");
  });
};

// ✅ Complexity analysis (same as yours)
export const analyzeComplexity = async (prompt: string) => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the complexity of this rug design prompt: "${prompt}".
      Return JSON with:
      - complexity
      - reasoning
      - rejected
      - rejectionReason`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  });
};
