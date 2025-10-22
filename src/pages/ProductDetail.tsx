import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  Truck,
  Shield,
  Package,
  Star,
  Store,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../hooks/useToast";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { ProductGallery } from "../components/product/ProductGallery";
import { Breadcrumb } from "../components/ui/Breadcrumb";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../utils/format";
import { useAffiliate } from "@/hooks/useAffiliate";
import { useAuth } from "@/contexts/AuthContext";
import ReferralShare from "@/components/ui/ReferralShare";
import WhatsAppOrderButton from "@/components/ui/WhatsAppOrderButton";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  product_images: string[];
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
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");
  const { addItem } = useCart();
  const { addOrUpdate } = useAffiliate();
  const { toast } = useToast();
  // const { toggleWishlist, isInWishlist } = useWishlist();
  const { addRecentProduct } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!slug) return;
    if (user === undefined) return; // wait for user to load

    let called = false;

    const run = async () => {
      if (called) return;
      called = true;
      await loadProduct(ref);
      // await loadReviews();
    };

    run();
  }, [slug, ref, user]); // keep these minimal

  async function loadProduct(ref: string | null) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `*, product_images(
            id,
            image_url,
            alt_text,
            sort_order,
            is_primary
          ), category:categories(id, name, slug)`
        )
        .eq("slug", slug)
        .order("sort_order", {
          ascending: true,
          foreignTable: "product_images",
        })
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProduct(data);
        if (ref) {
          addOrUpdate(data.id, ref);
        }
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
          image: data.product_images[0]?.image_url,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error loading product",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadSeller(sellerId: string) {
    try {
      const { data, error } = await supabase
        .from("sellers")
        .select("id, shop_name")
        .eq("id", sellerId)
        .eq("status", "approved")
        .maybeSingle();

      if (error) throw error;
      if (data) setSeller(data);
    } catch (error) {
      console.error("Error loading seller:", error);
    }
  }

  async function loadReviews() {
    try {
      const { data: productData } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!productData) return;

      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("product_id", productData.id)
        .eq("status", "approved");

      if (error) throw error;
      if (data && data.length > 0) {
        const avg =
          data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(avg);
        setReviewCount(data.length);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product not found
          </h2>
          <p className="text-gray-600">
            The product you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const discount = Math.round(
    ((product.mrp - product.price) / product.mrp) * 100
  );

  const handleAddToCart = async () => {
    try {
      await addItem({
        product_id: product.id,
        title: product.title,
        price: product.price,
        image: product.product_images[0].image_url,
        variant: {},
        quantity,
      });
      toast({
        title: "Success",
        description: "Added to cart!",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {category && (
          <Breadcrumb
            items={[
              { label: category.name, path: `/category/${category.slug}` },
              { label: product?.title || "" },
            ]}
            className="mb-6"
          />
        )}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ProductGallery
              images={product.product_images}
              youtubeIds={product.youtube_ids}
              title={product.title}
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>

              {product.codes.length > 0 && (
                <p className="text-sm text-gray-600 mb-4">
                  Product Code: {product.codes.join(", ")}
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
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
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
                  <span className="text-green-600 font-semibold">
                    Save {discount}%
                  </span>
                )}
              </div>

              {product.stock > 0 ? (
                <p className="text-green-600 font-medium mb-4">
                  In Stock ({product.stock} available)
                </p>
              ) : (
                <p className="text-red-600 font-medium mb-4">Out of Stock</p>
              )}

              <p className="text-gray-600 mb-6">{product.description}</p>

              {product.features && product.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Features:
                  </h3>
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
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
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
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>

              {/* <button
                onClick={async () => {
                  try {
                    await toggleWishlist(product.id);
                    toast.success(
                      isInWishlist(product.id)
                        ? "Removed from wishlist"
                        : "Added to wishlist"
                    );
                  } catch (error: any) {
                    toast.error(error.message || "Failed to update wishlist");
                  }
                }}
                className={`p-3 border-2 rounded-lg transition-colors ${
                  isInWishlist(product.id)
                    ? "border-red-600 bg-red-50 text-red-600"
                    : "border-gray-300 hover:border-red-600 hover:text-red-600"
                }`}
              >
                <Heart
                  className={`w-6 h-6 ${
                    isInWishlist(product.id) ? "fill-red-600" : ""
                  }`}
                />
              </button> */}
            </div>

            <WhatsAppOrderButton product={product} defaultQuantity={quantity} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t">
              {/* Shipping */}
              <div className="text-center group">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 transition group-hover:bg-red-100">
                  <Truck className="w-7 h-7 text-red-600 transition group-hover:scale-110" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Free Shipping
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  On all orders above ₹999
                </p>
              </div>
              {/* Secure Payment */}
              <div className="text-center group">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 transition group-hover:bg-red-100">
                  <Shield className="w-7 h-7 text-red-600 transition group-hover:scale-110" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Secure Payment
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  100% SSL encrypted checkout
                </p>
              </div>
              {/* Returns */}
              <div className="text-center group">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 transition group-hover:bg-red-100">
                  <Package className="w-7 h-7 text-red-600 transition group-hover:scale-110" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Easy Returns
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  1 day return policy
                </p>
              </div>
            </div>
            <ReferralShare sampleProduct={product} />
          </div>
        </div>

        {/* <div className="mt-16">
          <ReviewsList productId={product.id} />
        </div> */}
      </div>
    </div>
  );
}
