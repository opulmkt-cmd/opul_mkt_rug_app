export const stripeService = {
  async createPaymentIntent(amount: number, metadata: any) {
    console.log(`[StripeService] Creating payment intent: ${amount}`, metadata);
    const url = `${window.location.origin}/api/stripe/create-payment-intent`;
    console.log(`[StripeService] Fetching ${url} with POST`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        metadata,
      }),
    });

    console.log(`[StripeService] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[StripeService] Error response:', error);
      throw new Error(error.error || 'Failed to create payment intent');
    }

    return response.json();
  }
};
