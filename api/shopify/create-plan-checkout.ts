export default async function handler(req, res) {
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

  try {
    const response = await fetch(
      `https://${process.env.VITE_SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/draft_orders.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token":
            process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    res.json({
      invoiceUrl: result.draft_order.invoice_url,
      draftOrderId: result.draft_order.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
