import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface AddToCartButtonProps {
  productId: string;
  variant?: any;
  maxQuantity?: number;
  className?: string;
}

export function AddToCartButton({
  productId,
  variant,
  maxQuantity = 99,
  className = ''
}: AddToCartButtonProps) {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const cartItem = cartItems.find(
    item => item.product_id === productId &&
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(productId, 1, variant);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrease = async () => {
    if (currentQuantity < maxQuantity) {
      await updateQuantity(cartItem!.id, currentQuantity + 1);
    }
  };

  const handleDecrease = async () => {
    if (currentQuantity > 1) {
      await updateQuantity(cartItem!.id, currentQuantity - 1);
    } else if (currentQuantity === 1) {
      await updateQuantity(cartItem!.id, 0);
    }
  };

  if (currentQuantity > 0) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={handleDecrease}
            className="px-4 py-2 hover:bg-gray-100 transition-colors"
            disabled={isAdding}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 font-semibold min-w-[3rem] text-center border-x border-gray-300">
            {currentQuantity}
          </span>
          <button
            onClick={handleIncrease}
            className="px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={currentQuantity >= maxQuantity || isAdding}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`flex items-center justify-center gap-2 px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {showSuccess ? (
        <>
          <Check className="h-5 w-5" />
          <span>Added to Cart</span>
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
        </>
      )}
    </button>
  );
}
