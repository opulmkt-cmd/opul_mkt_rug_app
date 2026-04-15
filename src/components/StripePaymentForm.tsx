import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Loader2, ArrowRight } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/dashboard?payment=success',
        },
        redirect: 'if_required',
      });

      // ❌ Payment error
      if (error) {
        console.error("Stripe error:", error);
        onError(error.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // ❌ No paymentIntent (edge case)
      if (!paymentIntent) {
        onError('No payment confirmation received');
        setIsProcessing(false);
        return;
      }

      // ✅ Payment success
      if (paymentIntent.status === 'succeeded') {
        console.log("✅ Payment succeeded:", paymentIntent.id);

        // 🔥 WAIT for webhook to update Firebase
        await new Promise((resolve) => setTimeout(resolve, 2500));

        setIsProcessing(false);
        onSuccess();
      } else {
        console.warn("Unexpected payment status:", paymentIntent.status);
        onError('Payment not completed');
        setIsProcessing(false);
      }

    } catch (err: any) {
      console.error("Unexpected error:", err);
      onError('Something went wrong');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement className="mb-6" />

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full py-6 bg-[#EFBB76] text-black font-black text-xl rounded-full hover:bg-[#DBA762] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Pay ${amount} <ArrowRight className="w-6 h-6" />
          </>
        )}
      </button>
    </form>
  );
};
