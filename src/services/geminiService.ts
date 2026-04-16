export const geminiService = {
  async generateRugImage(prompt: string, userId: string) {
    const res = await fetch("/api/gemini?action=generate-image", {
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
  },

  async analyzeComplexity(prompt: string) {
    const res = await fetch("/api/gemini?action=analyze", {
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
  },
};
