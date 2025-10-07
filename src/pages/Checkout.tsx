import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';
import { CreditCard, Wallet, Package } from 'lucide-react';

interface Address {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
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

export function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    loadCheckoutData();
  }, [user]);

  const loadCheckoutData = async () => {
    try {
      const [addressesRes, cartRes, userRes] = await Promise.all([
        supabase.from('addresses').select('*').eq('user_id', user!.id),
        supabase.from('cart_items').select('*, product:products(title, price, tax_slab, images)').eq('user_id', user!.id),
        supabase.from('users').select('wallet_balance').eq('id', user!.id).single()
      ]);

      if (addressesRes.data) {
        setAddresses(addressesRes.data);
        const defaultAddr = addressesRes.data.find(a => a.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      }

      if (cartRes.data) setCartItems(cartRes.data);
      if (userRes.data) setWalletBalance(userRes.data.wallet_balance || 0);
    } catch (error) {
      console.error('Checkout load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const taxes = cartItems.reduce((sum, item) => {
    const itemTotal = item.product.price * item.quantity;
    return sum + (itemTotal * item.product.tax_slab / 100);
  }, 0);
  const shipping = subtotal > 1000 ? 0 : 100;
  const giftWrapFee = giftWrap ? 50 : 0;
  const walletDeduction = useWallet ? Math.min(walletBalance, subtotal) : 0;
  const total = subtotal + taxes + shipping + giftWrapFee - walletDeduction;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    const orderNumber = `ORD${Date.now()}`;
    const selectedAddr = addresses.find(a => a.id === selectedAddress);

    const { error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      user_id: user!.id,
      items: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal,
      taxes,
      shipping,
      wallet_used: walletDeduction,
      total,
      shipping_address: selectedAddr,
      gift_wrap: giftWrap,
      gift_message: giftMessage || null,
      notes: notes || null,
      status: 'pending',
    });

    if (!error) {
      await supabase.from('cart_items').delete().eq('user_id', user!.id);
      navigate('/orders');
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-red-800 text-white rounded-lg">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
            <div className="space-y-3">
              {addresses.map(addr => (
                <label key={addr.id} className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:border-red-800">
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{addr.name}</div>
                    <div className="text-sm text-gray-600">
                      {addr.address_line1}, {addr.address_line2 && `${addr.address_line2}, `}
                      {addr.city}, {addr.state} {addr.postal_code}
                    </div>
                    <div className="text-sm text-gray-600">{addr.phone}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-semibold">Additional Options</h2>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} />
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
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
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
                <span>{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
              </div>
              {giftWrap && (
                <div className="flex justify-between">
                  <span>Gift Wrap</span>
                  <span>{formatCurrency(giftWrapFee)}</span>
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

            {walletBalance > 0 && (
              <label className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} />
                <Wallet className="h-5 w-5" />
                <span className="text-sm">Use wallet balance ({formatCurrency(walletBalance)})</span>
              </label>
            )}

            <button
              onClick={handlePlaceOrder}
              className="w-full py-3 bg-red-800 text-white rounded-lg font-semibold hover:bg-red-900 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
