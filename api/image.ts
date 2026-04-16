export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // =====================================================
    // 🖼️ UPLOAD IMAGE (IMGBB)
    // =====================================================
    if (action === "upload") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST" });
      }

      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image required" });
      }

      const formData = new URLSearchParams();
      formData.append("image", image.split(",")[1]);

      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!result.success) {
        return res.status(500).json({ error: "ImgBB upload failed" });
      }

      return res.json({ url: result.data.url });
    }

    // =====================================================
    return res.status(404).json({ error: "Invalid action" });

  } catch (err: any) {
    console.error("❌ Image API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
