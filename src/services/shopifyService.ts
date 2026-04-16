const rawDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || '';

const SHOPIFY_DOMAIN = rawDomain
  ? (rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').includes('.') 
      ? rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '') 
      : `${rawDomain}.myshopify.com`)
  : '';

interface ShopifyCheckoutInput {
  variantId: string;
  quantity: number;
  customAttributes: { key: string; value: string }[];
}

export const shopifyService = {
  isConfigured: !!rawDomain,

  // =====================================================
  // 🛒 CREATE CHECKOUT (STOREFRONT)
  // =====================================================
  async createCheckout(input: ShopifyCheckoutInput) {
    if (!SHOPIFY_DOMAIN) {
      throw new Error('Shopify not configured');
    }

    const query = `
      mutation cartCreate($input: CartInput) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lines: [
          {
            merchandiseId: input.variantId.includes('gid://shopify/')
              ? input.variantId
              : `gid://shopify/ProductVariant/${input.variantId}`,
            quantity: input.quantity,
            attributes: input.customAttributes,
          },
        ],
      },
    };

    const response = await fetch('/api/shopify?action=storefront', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { query, variables } }),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      throw new Error(data?.errors?.[0]?.message || 'Shopify error');
    }

    return data.data.cartCreate.cart.checkoutUrl;
  },

  // =====================================================
  // 🎨 FORMAT ATTRIBUTES
  // =====================================================
  formatRugAttributes(config: any, imageUrl: string) {
    return [
      { key: '_image', value: imageUrl },
      { key: 'Design URL', value: imageUrl },
      { key: 'Prompt', value: config.prompt || 'Custom Design' },
      { key: 'Construction', value: config.construction || 'Hand-knotted' },
      { key: 'Material', value: config.materialTypes?.join(', ') || 'Wool' },
      { key: 'Size', value: `${config.width}x${config.length}` },
      { key: 'Pile', value: `${config.pileType} (${config.pileHeight})` },
    ];
  },

  // =====================================================
  // 🧾 CREATE DYNAMIC CHECKOUT (CUSTOM PRODUCT)
  // =====================================================
  async createDynamicCheckout(input: {
    title: string;
    price: number;
    imageUrl: string;
    attributes: any[];
    type: string;
  }) {
    const response = await fetch(
      '/api/shopify?action=create-custom-checkout',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create product');
    }

    const variantId = result.variantId;

    // small delay for Shopify sync
    await new Promise((r) => setTimeout(r, 1500));

    return this.createCheckout({
      variantId,
      quantity: 1,
      customAttributes: input.attributes,
    });
  },

  // =====================================================
  // 💳 PLAN UPGRADE CHECKOUT
  // =====================================================
  async createPlanUpgradeCheckout(email: string, userId: string) {
    const response = await fetch(
      '/api/shopify?action=create-plan-checkout',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create upgrade checkout');
    }

    return result; // { invoiceUrl, draftOrderId }
  },

  // =====================================================
  // ✅ VERIFY PAYMENT
  // =====================================================
  async verifyUpgrade(draftOrderId: string) {
    const response = await fetch(
      `/api/shopify?action=verify-upgrade&id=${draftOrderId}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Verification failed');
    }

    return result.isPaid;
  }
};
