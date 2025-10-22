import { useCart } from "../../contexts/CartContext";
import { X, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/format";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } =
    useCart();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag size={24} />
              <h2 className="text-xl font-bold">Shopping Cart</h2>
              <span className="bg-red-800 text-white text-sm px-2 py-1 rounded-full">
                {totalItems}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <Link
                  to="/"
                  onClick={onClose}
                  className="inline-block px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 bg-gray-50 p-4 rounded-lg"
                  >
                    <LazyLoadImage
                      src={item.image || "https://via.placeholder.com/80"}
                      alt={item.name}
                      effect="blur"
                      wrapperClassName="w-20 h-20 object-cover rounded"
                      className="w-20 h-20 object-cover rounded"
                    />

                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {formatPrice(item.price)}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

              <div className="space-y-2">
                <Link
                  to="/cart"
                  onClick={onClose}
                  className="block w-full py-3 text-center border border-red-800 text-red-800 rounded-lg hover:bg-red-50 font-medium"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="block w-full py-3 text-center bg-red-800 text-white rounded-lg hover:bg-red-900 font-medium"
                >
                  Checkout
                </Link>
              </div>

              <p className="text-sm text-gray-500 text-center">
                Shipping and taxes calculated at checkout
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
