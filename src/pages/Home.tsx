import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { ProductCard } from '../components/product/ProductCard';

export function Home() {
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

  const featuredProducts = [
    {
      id: '1',
      title: 'Banarasi Silk Saree - Red',
      slug: 'banarasi-silk-saree-red',
      price: 12999,
      mrp: 18999,
      image: 'https://images.pexels.com/photos/1164674/pexels-photo-1164674.jpeg?auto=compress&cs=tinysrgb&w=400',
      stock: 10,
      featured: true,
    },
    {
      id: '2',
      title: 'Kanjivaram Silk Saree - Gold',
      slug: 'kanjivaram-silk-saree-gold',
      price: 15999,
      mrp: 22999,
      image: 'https://images.pexels.com/photos/3621953/pexels-photo-3621953.jpeg?auto=compress&cs=tinysrgb&w=400',
      stock: 5,
      featured: true,
    },
    {
      id: '3',
      title: 'Temple Jewellery Necklace Set',
      slug: 'temple-jewellery-necklace',
      price: 8999,
      mrp: 12999,
      image: 'https://images.pexels.com/photos/1446262/pexels-photo-1446262.jpeg?auto=compress&cs=tinysrgb&w=400',
      stock: 15,
      featured: true,
    },
    {
      id: '4',
      title: 'Designer Silk Saree - Blue',
      slug: 'designer-silk-saree-blue',
      price: 9999,
      mrp: 14999,
      image: 'https://images.pexels.com/photos/7679454/pexels-photo-7679454.jpeg?auto=compress&cs=tinysrgb&w=400',
      stock: 8,
      featured: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <HeroCarousel slides={heroSlides} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-red-600" />
              <h2 className="section-title mb-0">Featured Products</h2>
            </div>
            <Link
              to="/category/featured"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors group"
            >
              View All
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

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
                  image={product.image}
                  inStock={product.stock > 0}
                  featured={product.featured}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
