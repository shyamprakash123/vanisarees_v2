import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { Pagination } from '../components/ui/Pagination';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  images: string[];
  stock: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

export function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    loadCategory();
    loadProducts();
  }, [slug, currentPage, sortBy, priceRange]);

  async function loadCategory() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      setCategory(data);
    } catch (error) {
      console.error('Error loading category:', error);
    }
  }

  async function loadProducts() {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('id, title, slug, price, mrp, images, stock, category_id, categories!inner(slug)', { count: 'exact' })
        .eq('categories.slug', slug);

      if (priceRange !== 'all') {
        const ranges: Record<string, [number, number]> = {
          'under-5000': [0, 5000],
          '5000-10000': [5000, 10000],
          '10000-20000': [10000, 20000],
          'above-20000': [20000, 999999],
        };
        const [min, max] = ranges[priceRange] || [0, 999999];
        query = query.gte('price', min).lte('price', max);
      }

      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('title', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, count, error } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setProducts(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setSearchParams({ sort: value, price: priceRange });
    setCurrentPage(1);
  };

  const handlePriceChange = (value: string) => {
    setPriceRange(value);
    setSearchParams({ sort: sortBy, price: value });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: category?.name || slug?.replace(/-/g, ' ') || 'Products' },
          ]}
          className="mb-6"
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 capitalize">
            {category?.name || slug?.replace(/-/g, ' ') || 'All Products'}
          </h1>
          {category?.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4 flex-1`}>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <SlidersHorizontal className="w-4 h-4 inline mr-2" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Price Range
              </label>
              <select
                value={priceRange}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="under-5000">Under ₹5,000</option>
                <option value="5000-10000">₹5,000 - ₹10,000</option>
                <option value="10000-20000">₹10,000 - ₹20,000</option>
                <option value="above-20000">Above ₹20,000</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-80"></div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-slideUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard
                    id={product.id}
                    title={product.title}
                    slug={product.slug}
                    price={product.price}
                    mrp={product.mrp}
                    image={product.images[0]}
                    inStock={product.stock > 0}
                  />
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No products found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
