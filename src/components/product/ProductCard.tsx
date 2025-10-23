import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Eye } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../hooks/useToast";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  price: number;
  mrp?: number;
  image: string;
  inStock: boolean;
  featured?: boolean;
  onQuickView?: () => void;
}

export function ProductCard({
  id,
  title,
  slug,
  price,
  mrp,
  image,
  inStock,
  featured,
  onQuickView,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  const discount =
    mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;

    try {
      await addItem({
        product_id: id,
        title,
        price,
        image,
        variant: {},
        quantity: 1,
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
    <Link
      to={`/product/${slug}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-lg bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {featured && (
          <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Featured
          </div>
        )}

        {discount > 0 && (
          <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            {discount}% OFF
          </div>
        )}

        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <LazyLoadImage
            src={
              image ||
              "https://images.pexels.com/photos/1164674/pexels-photo-1164674.jpeg"
            }
            alt={title}
            effect="blur"
            wrapperClassName="w-full h-full overflow-hidden"
            className="w-full h-full object-cover transition-transform duration-700 ease-in-out transform "
          />

          {!inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                Out of Stock
              </span>
            </div>
          )}

          {/* <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            {onQuickView && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onQuickView();
                }}
                className="bg-white hover:bg-red-600 text-gray-900 hover:text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                title="Quick View"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="bg-white hover:bg-red-600 text-gray-900 hover:text-white p-3 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50"
              title="Add to Cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>

            <button
              className="bg-white hover:bg-red-600 text-gray-900 hover:text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
              title="Add to Wishlist"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div> */}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-700 transition-colors">
            {title}
          </h3>

          <div className="flex items-center gap-2 justify-between">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {mrp && mrp > price && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{mrp.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex bg-primary-600 hover:bg-primary-800 text-white p-2 rounded-md transition-all duration-300 disabled:opacity-50"
              title="Add to Cart"
            >
              <ShoppingCart className="w-5 h-5 sm:mr-1" />
              <p className="hidden sm:block">Add to Cart</p>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
