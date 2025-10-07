import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Heart, ExternalLink, Star } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../hooks/useToast';
import { useWishlist } from '../../hooks/useWishlist';

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  images: string[];
  stock: number;
  description?: string;
  codes?: string[];
}

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();
  const toast = useToast();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!product) return null;

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAddToCart = async () => {
    try {
      await addItem({
        product_id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        variant: {},
        quantity,
      });
      toast.success('Added to cart!');
      onClose();
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlist = async () => {
    try {
      await toggleWishlist(product.id);
      toast.success(isInWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full animate-slideUp">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 p-6">
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-red-800' : 'border-gray-200'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h2>

                {product.codes && product.codes.length > 0 && (
                  <p className="text-sm text-gray-600 mb-4">
                    Product Code: {product.codes.join(', ')}
                  </p>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        {formatCurrency(product.mrp)}
                      </span>
                      <span className="text-green-600 font-semibold">{discount}% OFF</span>
                    </>
                  )}
                </div>

                {product.stock > 0 ? (
                  <p className="text-green-600 font-medium mb-4">In Stock</p>
                ) : (
                  <p className="text-red-600 font-medium mb-4">Out of Stock</p>
                )}

                {product.description && (
                  <p className="text-gray-600 mb-6 line-clamp-3">{product.description}</p>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <label className="font-medium text-gray-900">Quantity:</label>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1 py-3 bg-red-800 text-white rounded-lg font-semibold hover:bg-red-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleWishlist}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      isInWishlist(product.id)
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-300 hover:border-red-600 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`h-6 w-6 ${isInWishlist(product.id) ? 'fill-red-600' : ''}`} />
                  </button>
                </div>

                <Link
                  to={`/product/${product.slug}`}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-red-800 hover:text-red-800 transition-colors"
                  onClick={onClose}
                >
                  View Full Details
                  <ExternalLink className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
