interface RazorpayOrderData {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayPaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayPaymentOptions) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (
  orderData: RazorpayOrderData
): Promise<RazorpayOrder> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create Razorpay order');
  }

  return response.json();
};

export const openRazorpayCheckout = async (
  options: Omit<RazorpayPaymentOptions, 'key'>
): Promise<void> => {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded) {
    throw new Error('Failed to load Razorpay SDK');
  }

  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (!razorpayKey) {
    throw new Error('Razorpay key not configured');
  }

  const razorpayOptions: RazorpayPaymentOptions = {
    ...options,
    key: razorpayKey,
  };

  const razorpayInstance = new window.Razorpay(razorpayOptions);
  razorpayInstance.open();
};

export const verifyRazorpayPayment = async (
  paymentData: RazorpayPaymentResponse
): Promise<boolean> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-razorpay-payment`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    }
  );

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result.verified === true;
};
