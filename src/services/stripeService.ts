export const stripeService = {
  async createPaymentIntent(amount: number, metadata: any) {
    const url = `${window.location.origin}/api/stripe/create-payment-intent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, metadata }),
    });

    const text = await response.text();
    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("JSON parse error:", text);
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to create payment intent");
    }

    return data;
  },

  async redeemPromoCode(promoCode: string, userId: string) {
    const url = `${window.location.origin}/api/stripe/redeem-promo`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ promoCode, userId }),
    });

    const text = await response.text();
    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("JSON parse error:", text);
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to redeem promo code");
    }

    return data;
  }
};
