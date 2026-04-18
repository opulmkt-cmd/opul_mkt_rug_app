export default async function handler(req, res) {
  const { action } = req.query;

  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  try {
    // =====================================================
    // 🛒 CREATE CUSTOM PRODUCT
    // =====================================================
    if (action === "create-custom-checkout") {
      const { title, price, imageUrl } = req.body;

      const payload = {
        product: {
          title,
          status: "active",
          variants: [{ price: String(price) }],
          images: imageUrl ? [{ src: imageUrl }] : [],
        },
      };

      const response = await fetch(
        `https://${domain}/admin/api/2024-01/products.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": adminToken,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      console.log("🔥 Shopify response:", JSON.stringify(result, null, 2));

      if (!response.ok || result.errors) {
        return res.status(500).json({
          error: "Shopify API failed",
          details: result.errors || result,
        });
      }

      if (!result?.product?.variants?.length) {
        return res.status(500).json({
          error: "Product created but no variants returned",
          raw: result,
        });
      }

      const variantId = `gid://shopify/ProductVariant/${result.product.variants[0].id}`;

      return res.json({ variantId });
    }

    // =====================================================
    // 🛍️ STOREFRONT GRAPHQL
    // =====================================================
    if (action === "storefront") {
      const response = await fetch(
        `https://${domain}/api/2024-01/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": storefrontToken,
          },
          body: JSON.stringify(req.body.payload || req.body),
        }
      );

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // =====================================================
    return res.status(404).json({ error: "Invalid action" });

  } catch (err: any) {
    console.error("❌ Shopify API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
