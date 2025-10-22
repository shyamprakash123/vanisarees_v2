import { Link } from "react-router-dom";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import { formatCurrency } from "../../utils/format";
import { Clock, Trash2 } from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

export function RecentlyViewed() {
  const { recentProducts, deleteRecentProduct } = useRecentlyViewed();

  if (recentProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-6 w-6 text-red-800" />
          <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recentProducts.map((product, index) => (
            <div
              key={product.id}
              className="group relative bg-white rounded-lg shadow hover:shadow-md transition-all animate-slideUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  deleteRecentProduct(product.id);
                }}
                className="absolute top-2 right-2 p-1 rounded-full z-50 bg-gray-100 hover:bg-red-100 transition"
              >
                <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
              </button>

              <Link to={`/product/${product.slug}`}>
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  <LazyLoadImage
                    src={product.image}
                    alt={product.title}
                    effect="blur"
                    wrapperClassName="w-full h-full object-cover transition-transform duration-300"
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-red-800 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
