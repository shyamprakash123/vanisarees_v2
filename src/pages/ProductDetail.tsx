import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Heart, Truck, Shield, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../hooks/useToast';

export function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const toast = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = {
    id: '1',
    title: 'Banarasi Silk Saree - Red & Gold',
    description:
      'Exquisite handwoven Banarasi silk saree featuring intricate zari work in traditional patterns. Perfect for weddings and special occasions.',
    price: 12999,
    mrp: 18999,
    stock: 10,
    images: [
      'https://images.pexels.com/photos/1164674/pexels-photo-1164674.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3621953/pexels-photo-3621953.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
  };

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
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-white shadow-lg group">
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {discount}% OFF
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-red-600 ring-2 ring-red-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-green-600 font-semibold">Save {discount}%</span>
              </div>

              <p className="text-gray-600 mb-6">{product.description}</p>
            </div>

            <div className="flex items-center gap-4">
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

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button className="p-3 border-2 border-gray-300 rounded-lg hover:border-red-600 hover:text-red-600 transition-colors">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-sm font-medium">Free Shipping</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-sm font-medium">Secure Payment</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-sm font-medium">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
