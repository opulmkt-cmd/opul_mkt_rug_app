export const geminiService = {
  // 🎨 Generate Rug Image (with credits system)
  async generateRugImage(prompt: string, userId: string) {
    try {
      const res = await fetch("/api/gemini/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      return data.image;
    } catch (error: any) {
      console.error("Gemini Generate Error:", error);
      throw error;
    }
  },

  // 🧠 Analyze prompt complexity
  async analyzeComplexity(prompt: string) {
    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze prompt");
      }

      return data;
    } catch (error: any) {
      console.error("Gemini Analyze Error:", error);
      throw error;
    }
  },
};
