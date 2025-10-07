import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Tag } from 'lucide-react';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { ComboSlider } from '../components/home/ComboSlider';
import { OffersGrid } from '../components/home/OffersGrid';
import { ProductCard } from '../components/product/ProductCard';
import { RecentlyViewed } from '../components/product/RecentlyViewed';
import { SellerStatusBanner } from '../components/seller/SellerStatusBanner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  images: string[];
  stock: number;
  featured: boolean;
  trending: boolean;
}

export function Home() {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const [featuredRes, trendingRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, title, slug, price, mrp, images, stock, featured, trending')
          .eq('featured', true)
          .eq('active', true)
          .limit(8),
        supabase
          .from('products')
          .select('id, title, slug, price, mrp, images, stock, featured, trending')
          .eq('trending', true)
          .eq('active', true)
          .limit(8),
      ]);

      if (featuredRes.data) setFeaturedProducts(featuredRes.data);
      if (trendingRes.data) setTrendingProducts(trendingRes.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  const heroSlides = [
    {
      id: '1',
      title: 'Exquisite Silk Sarees',
      subtitle: 'Discover the finest collection of traditional Indian sarees',
      image_url: 'https://images.pexels.com/photos/1164674/pexels-photo-1164674.jpeg?auto=compress&cs=tinysrgb&w=1920',
      cta_text: 'Shop Now',
      cta_link: '/category/sarees',
    },
    {
      id: '2',
      title: 'Elegant Jewellery',
      subtitle: 'Adorn yourself with timeless traditional pieces',
      image_url: 'https://images.pexels.com/photos/1446262/pexels-photo-1446262.jpeg?auto=compress&cs=tinysrgb&w=1920',
      cta_text: 'Explore Collection',
      cta_link: '/category/jewellery',
    },
  ];

  return (
    <div className="min-h-screen">
      <HeroCarousel slides={heroSlides} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {user && <SellerStatusBanner />}

        <section>
          <ComboSlider />
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Tag className="w-8 h-8 text-red-600" />
            <h2 className="section-title mb-0">Active Offers & Coupons</h2>
          </div>
          <OffersGrid />
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-red-600" />
              <h2 className="section-title mb-0">Featured Products</h2>
            </div>
            <Link
              to="/category/sarees"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors group"
            >
              View All
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg aspect-[3/4]"></div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-slideUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard
                    id={product.id}
                    title={product.title}
                    slug={product.slug}
                    price={product.price}
                    mrp={product.mrp}
                    image={product.images[0]}
                    inStock={product.stock > 0}
                    featured={product.featured}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {trendingProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-amber-500" />
                <h2 className="section-title mb-0">Trending Now</h2>
              </div>
              <Link
                to="/category/jewellery"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors group"
              >
                View All
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-slideUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard
                    id={product.id}
                    title={product.title}
                    slug={product.slug}
                    price={product.price}
                    mrp={product.mrp}
                    image={product.images[0]}
                    inStock={product.stock > 0}
                    featured={product.trending}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <RecentlyViewed />
    </div>
  );
}
