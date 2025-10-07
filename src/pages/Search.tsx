import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductCard } from '../components/product/ProductCard';
import { Pagination } from '../components/ui/Pagination';

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  images: string[];
  stock: number;
}

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 24;

  useEffect(() => {
    searchProducts();
  }, [query, currentPage]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('products')
        .select('id, title, slug, price, mrp, images, stock', { count: 'exact' })
        .eq('active', true);

      if (query) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,codes.cs.{${query}},sku.ilike.%${query}%`
        );
      }

      const { data, count, error } = await queryBuilder
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {query ? `Search results for "${query}"` : 'All Products'}
        </h1>
        <p className="text-gray-600">
          {loading ? 'Searching...' : `${products.length} products found`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-80" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <div className="text-center py-16">
          <SearchIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No products found</h2>
          <p className="text-gray-500">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}
