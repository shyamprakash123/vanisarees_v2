import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../utils/format";
import {
  CreditCard,
  Wallet,
  Package,
  Tag,
  X,
  MapPin,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Breadcrumb } from "../components/ui/Breadcrumb";
import { CheckoutSteps } from "../components/checkout/CheckoutSteps";

interface Address {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    title: string;
    price: number;
    tax_slab: number;
    images: string[];
  };
}

const STEPS = [
  { id: 1, label: "Address" },
  { id: 2, label: "Review" },
  { id: 3, label: "Payment" },
];

export function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("prepaid");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin");
      return;
    }
    loadCheckoutData();
  }, [user]);

  const loadCheckoutData = async () => {
    try {
      const [addressesRes, cartRes, userRes] = await Promise.all([
        supabase.from("addresses").select("*").eq("user_id", user!.id),
        supabase
          .from("cart_items")
          .select("*, product:products(title, price, tax_slab, images)")
          .eq("user_id", user!.id),
        supabase
          .from("users")
          .select("wallet_balance")
          .eq("id", user!.id)
          .maybeSingle(),
      ]);

      if (addressesRes.data) {
        setAddresses(addressesRes.data);
        const defaultAddr = addressesRes.data.find((a) => a.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      }

      if (cartRes.data) setCartItems(cartRes.data);
      if (userRes.data) setWalletBalance(userRes.data.wallet_balance || 0);
    } catch (error) {
      console.error("Checkout load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("active", true)
        .maybeSingle();

      if (error || !coupon) {
        setCouponError("Invalid coupon code");
        return;
      }

      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        setCouponError("Coupon not yet valid");
        return;
      }

      if (coupon.valid_to && new Date(coupon.valid_to) < now) {
        setCouponError("Coupon expired");
        return;
      }

      const subtotalForCoupon = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      if (coupon.min_order && subtotalForCoupon < coupon.min_order) {
        setCouponError(`Minimum order value ₹${coupon.min_order} required`);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponError("");
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError("Failed to apply coupon");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const taxes = cartItems.reduce((sum, item) => {
    const itemTotal = item.product.price * item.quantity;
    return sum + (itemTotal * item.product.tax_slab) / 100;
  }, 0);
  const shipping = subtotal > 1000 ? 0 : 100;
  const giftWrapFee = giftWrap ? 50 : 0;

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      couponDiscount = (subtotal * appliedCoupon.value) / 100;
    } else if (appliedCoupon.type === "fixed") {
      couponDiscount = appliedCoupon.value;
    }
  }

  const walletDeduction = useWallet
    ? Math.min(walletBalance, subtotal - couponDiscount)
    : 0;
  const total =
    subtotal +
    taxes +
    shipping +
    giftWrapFee -
    couponDiscount -
    walletDeduction;

  const handleNext = () => {
    if (currentStep === 1 && !selectedAddress) {
      alert("Please select a delivery address");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert("Please select a delivery address");
      return;
    }

    setProcessing(true);
    try {
      const orderNumber = `ORD${Date.now()}`;
      const selectedAddr = addresses.find((a) => a.id === selectedAddress);

      const { error } = await supabase.from("orders").insert({
        order_number: orderNumber,
        user_id: user!.id,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        subtotal,
        taxes,
        shipping,
        wallet_used: walletDeduction,
        total,
        payment_method: paymentMethod,
        shipping_address: selectedAddr,
        gift_wrap: giftWrap,
        gift_message: giftMessage || null,
        notes: notes || null,
        status: "pending",
      });

      if (!error) {
        await supabase.from("cart_items").delete().eq("user_id", user!.id);
        navigate("/orders");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-6 py-2 bg-red-800 text-white rounded-lg"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Shopping Cart", path: "/cart" },
          { label: "Checkout" },
        ]}
        className="mb-6"
      />
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <CheckoutSteps currentStep={currentStep} steps={STEPS} />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-lg shadow space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-6 w-6 text-red-800" />
                <h2 className="text-xl font-semibold">Delivery Address</h2>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No saved addresses</p>
                  <button
                    onClick={() => navigate("/account/addresses")}
                    className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:border-red-800 transition-colors"
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{addr.name}</div>
                        <div className="text-sm text-gray-600">
                          {addr.address_line1},{" "}
                          {addr.address_line2 && `${addr.address_line2}, `}
                          {addr.city}, {addr.state} {addr.pincode}
                        </div>
                        <div className="text-sm text-gray-600">
                          {addr.phone}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => navigate("/cart")}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back to Cart
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedAddress}
                  className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-b-0"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.title}</h3>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-semibold">Additional Options</h2>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={(e) => setGiftWrap(e.target.checked)}
                  />
                  <span>Gift wrap (+{formatCurrency(50)})</span>
                </label>

                {giftWrap && (
                  <input
                    type="text"
                    placeholder="Gift message (optional)"
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                )}

                <textarea
                  placeholder="Order notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors flex items-center gap-2"
                >
                  Continue to Payment
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white p-6 rounded-lg shadow space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-6 w-6 text-red-800" />
                <h2 className="text-xl font-semibold">Payment Method</h2>
              </div>

              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "prepaid"
                      ? "border-red-800 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="prepaid"
                    checked={paymentMethod === "prepaid"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-5 w-5 text-red-800" />
                      <span className="font-semibold text-gray-900">
                        Prepaid (Online Payment)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pay securely using UPI, Credit/Debit Card, Net Banking, or
                      Wallet
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === "cod"
                      ? "border-red-800 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-5 w-5 text-red-800" />
                      <span className="font-semibold text-gray-900">
                        Cash on Delivery (COD)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Pay with cash when your order is delivered to your
                      doorstep
                    </p>
                  </div>
                </label>
              </div>

              {paymentMethod === "prepaid" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    You will be redirected to a secure payment gateway to
                    complete your transaction.
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing
                    ? "Processing..."
                    : paymentMethod === "cod"
                    ? "Place Order"
                    : "Proceed to Payment"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow space-y-4 sticky top-20">
            <h2 className="text-xl font-semibold">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span>{formatCurrency(taxes)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                </span>
              </div>
              {giftWrap && (
                <div className="flex justify-between">
                  <span>Gift Wrap</span>
                  <span>{formatCurrency(giftWrapFee)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              {walletDeduction > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Wallet</span>
                  <span>-{formatCurrency(walletDeduction)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {currentStep >= 2 && (
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have a coupon code?
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-sm text-green-600">applied</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="p-1 hover:bg-green-100 rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-green-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
                      />
                      <button
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-sm text-red-600 mt-1">{couponError}</p>
                  )}
                </div>

                {walletBalance > 0 && (
                  <label className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                    />
                    <Wallet className="h-5 w-5" />
                    <span className="text-sm">
                      Use wallet balance ({formatCurrency(walletBalance)})
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
