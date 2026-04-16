export default async function handler(req, res) {
  const { action } = req.query;

  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  try {
    // =====================================================
    // 🛒 1. CREATE CUSTOM CHECKOUT (PRODUCT)
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

      const variantId = `gid://shopify/ProductVariant/${result.product.variants[0].id}`;

      return res.json({ variantId });
    }

    // =====================================================
    // 💳 2. CREATE PLAN CHECKOUT
    // =====================================================
    if (action === "create-plan-checkout") {
      const { email, userId } = req.body;

      const payload = {
        draft_order: {
          line_items: [
            {
              title: "Pro Plan Upgrade",
              price: "20.00",
              quantity: 1,
            },
          ],
          customer: { email },
          note: userId,
        },
      };

      const response = await fetch(
        `https://${domain}/admin/api/2024-01/draft_orders.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": adminToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      return res.json({
        invoiceUrl: result.draft_order.invoice_url,
        draftOrderId: result.draft_order.id,
      });
    }

    // =====================================================
    // 🛍️ 3. STOREFRONT GRAPHQL
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
    // ✅ 4. VERIFY PAYMENT
    // =====================================================
    if (action === "verify-upgrade") {
      const { id } = req.query;

      const response = await fetch(
        `https://${domain}/admin/api/2024-01/draft_orders/${id}.json`,
        {
          headers: {
            "X-Shopify-Access-Token": adminToken,
          },
        }
      );

      const result = await response.json();

      const isPaid =
        result.draft_order.status === "completed" ||
        result.draft_order.order_id !== null;

      return res.json({ isPaid });
    }

    // =====================================================
    return res.status(404).json({ error: "Invalid action" });

  } catch (err: any) {
    console.error("❌ Shopify API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
