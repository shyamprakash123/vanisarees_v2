import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Truck, Shield, Package, Star, Store } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../hooks/useToast';
import { useWishlist } from '../hooks/useWishlist';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { ProductGallery } from '../components/product/ProductGallery';
import { ReviewsList } from '../components/product/ReviewsList';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[];
  youtube_ids: string[];
  codes: string[];
  sku: string;
  features: string[];
  seller_id: string | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Seller {
  id: string;
  shop_name: string;
  user_id: string;
}

export function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const toast = useToast();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addRecentProduct } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (slug) {
      loadProduct();
      loadReviews();
    }
  }, [slug]);

  async function loadProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name, slug)')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProduct(data);
        if (data.category) {
          setCategory(data.category as any);
        }
        if (data.seller_id) {
          loadSeller(data.seller_id);
        }

        addRecentProduct({
          id: data.id,
          slug: data.slug,
          title: data.title,
          price: data.price,
          image: data.images[0],
        });
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  async function loadSeller(sellerId: string) {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('id, shop_name, user_id')
        .eq('id', sellerId)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;
      if (data) setSeller(data);
    } catch (error) {
      console.error('Error loading seller:', error);
    }
  }

  async function loadReviews() {
    try {
      const { data: productData } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!productData) return;

      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productData.id)
        .eq('status', 'approved');

      if (error) throw error;
      if (data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(avg);
        setReviewCount(data.length);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse grid md:grid-cols-2 gap-8">
            <div className="bg-gray-200 aspect-square rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

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
        {category && (
          <Breadcrumb
            items={[
              { label: category.name, path: `/category/${category.slug}` },
              { label: product?.title || '' },
            ]}
            className="mb-6"
          />
        )}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ProductGallery
              images={product.images}
              youtubeIds={product.youtube_ids}
              title={product.title}
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>

              {product.codes.length > 0 && (
                <p className="text-sm text-gray-600 mb-4">
                  Product Code: {product.codes.join(', ')}
                </p>
              )}

              {reviewCount > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(averageRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {averageRating.toFixed(1)} ({reviewCount} reviews)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  {formatCurrency(product.mrp)}
                </span>
                {discount > 0 && (
                  <span className="text-green-600 font-semibold">Save {discount}%</span>
                )}
              </div>

              {product.stock > 0 ? (
                <p className="text-green-600 font-medium mb-4">In Stock ({product.stock} available)</p>
              ) : (
                <p className="text-red-600 font-medium mb-4">Out of Stock</p>
              )}

              <p className="text-gray-600 mb-6">{product.description}</p>

              {product.features && product.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
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

            {seller && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Store className="w-4 h-4" />
                  <span className="font-medium">Sold by</span>
                </div>
                <Link
                  to={`/seller/${seller.id}`}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  {seller.shop_name}
                </Link>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={async () => {
                  try {
                    await toggleWishlist(product.id);
                    toast.success(isInWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
                  } catch (error: any) {
                    toast.error(error.message || 'Failed to update wishlist');
                  }
                }}
                className={`p-3 border-2 rounded-lg transition-colors ${
                  isInWishlist(product.id)
                    ? 'border-red-600 bg-red-50 text-red-600'
                    : 'border-gray-300 hover:border-red-600 hover:text-red-600'
                }`}
              >
                <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'fill-red-600' : ''}`} />
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

        <div className="mt-16">
          <ReviewsList productId={product.id} />
        </div>
      </div>
    </div>
  );
}
