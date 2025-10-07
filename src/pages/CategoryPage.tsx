import { useParams } from 'react-router-dom';
import { ProductCard } from '../components/product/ProductCard';

export function CategoryPage() {
  const { slug } = useParams();

  const products = [
    {
      id: '1',
      title: 'Banarasi Silk Saree - Red',
      slug: 'banarasi-silk-saree-red',
      price: 12999,
      mrp: 18999,
      image: 'https://images.pexels.com/photos/1164674/pexels-photo-1164674.jpeg?auto=compress&cs=tinysrgb&w=400',
      stock: 10,
    },
    {
      id: '2',
      title: 'Kanjivaram Silk Saree - Gold',
      slug: 'kanjivaram-silk-saree-gold',
      price: 15999,
      mrp: 22999,
      image: 'https://images.pexels.com/photos/3621953/pexels-photo-3621953.jpeg?auto=compress&cs=tinysrgb&w=400',
      stock: 5,
    },
    {
      id: '3',
      title: 'Designer Silk Saree - Blue',
      slug: 'designer-silk-saree-blue',
      price: 9999,
      mrp: 14999,
      image: 'https://images.pexels.com/photos/7679454/pexels-photo-7679454.jpeg?auto=compress&cs=tinysrgb&w=400',
      stock: 8,
    },
    {
      id: '4',
      title: 'Cotton Saree - Green',
      slug: 'cotton-saree-green',
      price: 3999,
      mrp: 5999,
      image: 'https://images.pexels.com/photos/1164674/pexels-photo-1164674.jpeg?auto=compress&cs=tinysrgb&w=400',
      stock: 20,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 capitalize">
          {slug?.replace(/-/g, ' ') || 'All Products'}
        </h1>

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
                image={product.image}
                inStock={product.stock > 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
