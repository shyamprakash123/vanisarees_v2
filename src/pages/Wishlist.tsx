import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Heart, ShoppingCart, Trash2, Package } from "lucide-react";
import { formatCurrency } from "../utils/format";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../hooks/useToast";
import { Breadcrumb } from "../components/ui/Breadcrumb";
import { useWishlist } from "@/hooks/useWishlist";

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    mrp: number;
    product_images: string[];
    stock: number;
  };
  created_at: string;
}

export function Wishlist() {
  const { user } = useAuth();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  // const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   if (!user) {
  //     navigate("/auth/signin");
  //     return;
  //   }
  //   loadWishlist();
  // }, [user]);

  // const loadWishlist = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from("wishlist")
  //       .select(
  //         `*, product:products(id, title, slug, price, mrp, product_images(
  //         id,
  //         image_url,
  //         alt_text,
  //         sort_order,
  //         is_primary
  //       ), stock)`
  //       )
  //       .eq("user_id", user!.id)
  //       .order("created_at", {
  //         ascending: false,
  //         foreignTable: "product_images",
  //       });

  //     if (error) throw error;
  //     setWishlistItems(data || []);
  //   } catch (error) {
  //     console.error("Load wishlist error:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const removeFromWishlist = async (wishlistId: string) => {
  //   try {
  //     const { error } = await supabase
  //       .from("wishlist")
  //       .delete()
  //       .eq("id", wishlistId);

  //     if (error) throw error;
  //     setWishlistItems((items) =>
  //       items.filter((item) => item.id !== wishlistId)
  //     );
  //     toast.success("Removed from wishlist");
  //   } catch (error) {
  //     console.error("Remove from wishlist error:", error);
  //     toast.error("Failed to remove from wishlist");
  //   }
  // };

  const moveToCart = async (item: WishlistItem) => {
    try {
      await addItem({
        product_id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        image: item.product.product_images[0].image_url,
        variant: {},
        quantity: 1,
      });
      await removeFromWishlist(item.id);
      toast({
        title: "Success",
        description: "Moved to cart!",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move to cart",
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">Loading wishlist...</div>
    );
  }

  if (wishlistItems?.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Breadcrumb items={[{ label: "Wishlist" }]} className="mb-6" />
        <div className="bg-white rounded-2xl shadow-lg p-12">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-8">
            Save your favorite items here to purchase later
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Breadcrumb items={[{ label: "Wishlist" }]} className="mb-6" />
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <div className="flex items-center gap-2 text-gray-600">
            <Heart className="h-5 w-5 fill-red-600 text-red-600" />
            <span>{wishlistItems?.length} item(s)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems?.map((item, index) => {
            const discount = Math.round(
              ((item?.product.mrp - item?.product.price) / item?.product.mrp) *
                100
            );

            return (
              <div
                key={item?.product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow animate-slideUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <Link to={`/product/${item?.product.slug}`}>
                    <img
                      src={item?.product.product_images[0].image_url}
                      alt={item?.product.title}
                      className="w-full h-64 object-cover"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                  {discount > 0 && (
                    <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold">
                      {discount}% OFF
                    </div>
                  )}
                  {item?.product.stock === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <Link to={`/product/${item?.product.slug}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-red-800 transition-colors">
                      {item?.product.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(item?.product.price)}
                    </span>
                    {discount > 0 && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(item?.product.mrp)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => moveToCart(item)}
                    disabled={item?.product.stock === 0}
                    className="w-full py-2 bg-red-800 text-white rounded-lg font-medium hover:bg-red-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {item?.product.stock === 0
                      ? "Out of Stock"
                      : "Move to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
