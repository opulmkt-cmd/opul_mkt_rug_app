export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const response = await fetch(
      `https://${process.env.VITE_SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/draft_orders/${id}.json`,
      {
        headers: {
          "X-Shopify-Access-Token":
            process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
        },
      }
    );

    const result = await response.json();

    const isPaid =
      result.draft_order.status === "completed" ||
      result.draft_order.order_id !== null;

    res.json({ isPaid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
