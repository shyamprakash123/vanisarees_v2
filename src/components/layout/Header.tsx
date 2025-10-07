import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export function Header() {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="text-2xl font-bold text-red-700 group-hover:scale-110 transition-transform">
                VaniSarees
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/category/sarees" className="text-gray-700 hover:text-red-700 transition-colors font-medium">
              Sarees
            </Link>
            <Link to="/category/jewellery" className="text-gray-700 hover:text-red-700 transition-colors font-medium">
              Jewellery
            </Link>
            <Link to="/category/combos" className="text-gray-700 hover:text-red-700 transition-colors font-medium">
              Combos
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Search className="w-5 h-5 text-gray-700" />
            </button>

            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <User className="w-5 h-5 text-gray-700" />
            </button>

            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white animate-slideDown">
            <nav className="flex flex-col px-4 py-4 gap-2">
              <Link
                to="/category/sarees"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sarees
              </Link>
              <Link
                to="/category/jewellery"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jewellery
              </Link>
              <Link
                to="/category/combos"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Combos
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
