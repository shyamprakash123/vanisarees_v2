import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { formatCurrency } from '../../utils/format';
import { Clock } from 'lucide-react';

export function RecentlyViewed() {
  const { recentProducts } = useRecentlyViewed();

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
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              className="group bg-white rounded-lg shadow hover:shadow-md transition-all animate-slideUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          ))}
        </div>
      </div>
    </div>
  );
}
