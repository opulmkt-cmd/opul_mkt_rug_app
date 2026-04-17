export default async function handler(req, res) {
  const { action } = req.query;

  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  try {
    // =====================================================
    // 🛒 CREATE CUSTOM PRODUCT (RUG)
    // =====================================================
    if (action === "create-custom-checkout") {
      const { title, price, imageUrl } = req.body;

      const payload = {
        product: {
          title,
          status: "active",
          variants: [{ price }],
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

      if (!result?.product?.variants?.length) {
        throw new Error("Failed to create Shopify product");
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
