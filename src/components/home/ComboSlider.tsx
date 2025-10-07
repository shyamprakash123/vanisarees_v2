import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { supabase } from '../../lib/supabase';

interface Combo {
  id: string;
  title: string;
  description: string;
  combo_price: number;
  original_price: number;
  product_ids: string[];
}

export function ComboSlider() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCombos();
  }, []);

  async function loadCombos() {
    try {
      const { data, error } = await supabase
        .from('combos')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) setCombos(data);
    } catch (error) {
      console.error('Error loading combos:', error);
    } finally {
      setLoading(false);
    }
  }

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % combos.length);
  };

  const previous = () => {
    setCurrentIndex((prev) => (prev - 1 + combos.length) % combos.length);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 rounded-lg h-64"></div>
      </div>
    );
  }

  if (combos.length === 0) {
    return null;
  }

  const currentCombo = combos[currentIndex];
  const discount = Math.round(
    ((currentCombo.original_price - currentCombo.combo_price) / currentCombo.original_price) * 100
  );

  return (
    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl overflow-hidden border border-amber-200">
      <div className="p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-8 h-8 text-amber-600" />
          <h3 className="text-2xl font-bold text-gray-900">Special Combo Offers</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div>
              <h4 className="text-3xl font-bold text-gray-900 mb-2">
                {currentCombo.title}
              </h4>
              <p className="text-gray-600 text-lg">{currentCombo.description}</p>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-red-600">
                {formatCurrency(currentCombo.combo_price)}
              </span>
              <span className="text-2xl text-gray-400 line-through">
                {formatCurrency(currentCombo.original_price)}
              </span>
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {discount}% OFF
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="w-4 h-4" />
              <span>{currentCombo.product_ids.length} items in this combo</span>
            </div>

            <Link
              to={`/combo/${currentCombo.id}`}
              className="inline-block bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              View Combo Details
            </Link>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full blur-3xl opacity-30"></div>
              <div className="relative bg-white p-8 rounded-2xl shadow-xl">
                <Package className="w-32 h-32 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {combos.length > 1 && (
        <>
          <button
            onClick={previous}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all"
            aria-label="Previous combo"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all"
            aria-label="Next combo"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {combos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-amber-600 w-8' : 'bg-amber-300'
                }`}
                aria-label={`Go to combo ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
