import { useState } from 'react';
import { CreditCard, Wallet, Banknote } from 'lucide-react';

interface PaymentFormProps {
  total: number;
  onPaymentSubmit: (paymentMethod: string, paymentData?: any) => Promise<void>;
  walletBalance?: number;
}

type PaymentMethod = 'card' | 'wallet' | 'cod' | 'upi';

export function PaymentForm({ total, onPaymentSubmit, walletBalance = 0 }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const paymentData: any = {
        method: selectedMethod,
        amount: total
      };

      if (selectedMethod === 'card') {
        paymentData.card = {
          number: cardDetails.number.replace(/\s/g, ''),
          name: cardDetails.name,
          expiry: cardDetails.expiry,
          cvv: cardDetails.cvv
        };
      } else if (selectedMethod === 'upi') {
        paymentData.upi_id = upiId;
      }

      await onPaymentSubmit(selectedMethod, paymentData);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const paymentMethods = [
    {
      id: 'card' as PaymentMethod,
      name: 'Credit/Debit Card',
      icon: CreditCard,
      available: true
    },
    {
      id: 'wallet' as PaymentMethod,
      name: 'Wallet',
      icon: Wallet,
      available: walletBalance >= total,
      subtitle: walletBalance >= total
        ? `Available: ₹${walletBalance.toFixed(2)}`
        : `Insufficient balance (₹${walletBalance.toFixed(2)})`
    },
    {
      id: 'upi' as PaymentMethod,
      name: 'UPI',
      icon: Banknote,
      available: true
    },
    {
      id: 'cod' as PaymentMethod,
      name: 'Cash on Delivery',
      icon: Banknote,
      available: total <= 5000
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Select Payment Method</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => method.available && setSelectedMethod(method.id)}
                disabled={!method.available}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  selectedMethod === method.id
                    ? 'border-red-800 bg-red-50'
                    : method.available
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <Icon className={`h-6 w-6 ${selectedMethod === method.id ? 'text-red-800' : 'text-gray-600'}`} />
                <div className="text-left">
                  <div className={`font-medium ${selectedMethod === method.id ? 'text-red-800' : 'text-gray-900'}`}>
                    {method.name}
                  </div>
                  {method.subtitle && (
                    <div className="text-xs text-gray-500">{method.subtitle}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedMethod === 'card' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              type="text"
              value={cardDetails.number}
              onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardDetails.name}
              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
              placeholder="John Doe"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                placeholder="MM/YY"
                maxLength={5}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').substring(0, 3) })}
                placeholder="123"
                maxLength={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {selectedMethod === 'upi' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UPI ID
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {selectedMethod === 'wallet' && (
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            ₹{total.toFixed(2)} will be deducted from your wallet balance.
          </p>
        </div>
      )}

      {selectedMethod === 'cod' && (
        <div className="p-4 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-800">
            Please keep ₹{total.toFixed(2)} ready in cash for delivery.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-3 bg-red-800 text-white rounded-lg font-semibold hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
      </button>

      <p className="text-xs text-center text-gray-500">
        Your payment information is secure and encrypted
      </p>
    </form>
  );
}
