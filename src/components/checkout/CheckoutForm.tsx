import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../hooks/useToast";

interface Address {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface CheckoutFormProps {
  onSubmit: (data: CheckoutData) => void;
  subtotal: number;
  shippingCharge: number;
  tax: number;
  total: number;
}

export interface CheckoutData {
  address: Address;
  paymentMethod: string;
  giftWrap: boolean;
  giftMessage: string;
  notes: string;
  couponCode: string;
  useWallet: boolean;
}

export function CheckoutForm({
  onSubmit,
  subtotal,
  shippingCharge,
  tax,
  total,
}: CheckoutFormProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("online");
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchAddresses();
    fetchWalletBalance();
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
      if (data && data.length > 0) {
        setSelectedAddressId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    }
  };

  const fetchWalletBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setWalletBalance(data?.wallet_balance || 0);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedAddress = addresses.find(
      (addr) => addr.id === selectedAddressId
    );
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    onSubmit({
      address: selectedAddress,
      paymentMethod,
      giftWrap,
      giftMessage,
      notes,
      couponCode,
      useWallet,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Delivery Address</h2>

        {addresses.length === 0 ? (
          <p className="text-gray-500">
            No addresses found. Please add an address first.
          </p>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`block p-4 border rounded-lg cursor-pointer ${
                  selectedAddressId === address.id
                    ? "border-red-800 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  checked={selectedAddressId === address.id}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="mr-3"
                />
                <div className="inline-block">
                  <p className="font-medium">{address.name}</p>
                  <p className="text-sm text-gray-600">
                    {address.address_line1}, {address.address_line2}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: {address.phone}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Payment Method</h2>

        <div className="space-y-3">
          <label className="flex items-center p-4 border rounded-lg cursor-pointer">
            <input
              type="radio"
              name="payment"
              value="online"
              checked={paymentMethod === "online"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div>
              <p className="font-medium">Online Payment</p>
              <p className="text-sm text-gray-600">
                Pay using UPI, Card, or Net Banking
              </p>
            </div>
          </label>

          <label className="flex items-center p-4 border rounded-lg cursor-pointer">
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div>
              <p className="font-medium">Cash on Delivery</p>
              <p className="text-sm text-gray-600">
                Pay when you receive the product
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Additional Options</h2>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={giftWrap}
              onChange={(e) => setGiftWrap(e.target.checked)}
              className="mr-3"
            />
            <span>Gift Wrap (₹50)</span>
          </label>

          {giftWrap && (
            <textarea
              placeholder="Gift message (optional)"
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              rows={3}
            />
          )}

          <textarea
            placeholder="Order notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code
            </label>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>

          {walletBalance > 0 && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useWallet}
                onChange={(e) => setUseWallet(e.target.checked)}
                className="mr-3"
              />
              <span>
                Use Wallet Balance (₹{walletBalance.toFixed(2)} available)
              </span>
            </label>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>₹{shippingCharge.toFixed(2)}</span>
          </div>
          {giftWrap && (
            <div className="flex justify-between">
              <span>Gift Wrap</span>
              <span>₹50.00</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          {useWallet && (
            <div className="flex justify-between text-green-600">
              <span>Wallet Discount</span>
              <span>-₹{Math.min(walletBalance, total).toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>
              ₹
              {(
                total +
                (giftWrap ? 50 : 0) -
                (useWallet ? Math.min(walletBalance, total) : 0)
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 font-medium"
      >
        Proceed to Payment
      </button>
    </form>
  );
}
