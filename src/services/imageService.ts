export const imageService = {
  async uploadToImgBB(base64Data: string): Promise<string> {
    try {
      // 🔥 ALWAYS use backend (safer)
      const response = await fetch('/api/image?action=upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data }),
      });

      const text = await response.text();
      let result: any = {};

      try {
        result = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("JSON parse error:", text);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return result.url;

    } catch (error: any) {
      console.error('ImgBB Upload Error:', error);
      throw error;
    }
  }
};
