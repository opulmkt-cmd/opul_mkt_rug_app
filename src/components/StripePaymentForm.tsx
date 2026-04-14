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

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/dashboard?payment=success',
      },
      redirect: 'if_required'
    });

    if (error) {
      onError(error.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement className="mb-6" />
      
      <button
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
