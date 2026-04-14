export const geminiService = {
  async generateRugImage(prompt: string) {
    const res = await fetch("/api/gemini/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    return data.image;
  },

  async analyzeComplexity(prompt: string) {
    const res = await fetch("/api/gemini/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    return data;
  },
};
