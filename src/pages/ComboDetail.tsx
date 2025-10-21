import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Package, ShoppingCart, ArrowRight } from "lucide-react";
import { ProductCard } from "../components/product/ProductCard";
import { supabase } from "../lib/supabase";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../hooks/useToast";
import { formatCurrency } from "../utils/format";

interface Combo {
  id: string;
  title: string;
  description: string;
  combo_price: number;
  original_price: number;
  product_ids: string[];
  valid_from: string;
  valid_to: string;
  metadata: any;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  product_images: string[];
  stock: number;
}

export function ComboDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const toast = useToast();
  const [combo, setCombo] = useState<Combo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCombo();
    }
  }, [id]);

  async function loadCombo() {
    try {
      const { data: comboData, error: comboError } = await supabase
        .from("combos")
        .select("*")
        .eq("id", id)
        .eq("active", true)
        .maybeSingle();

      if (comboError) throw comboError;
      if (!comboData) {
        setLoading(false);
        return;
      }

      setCombo(comboData);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, title, slug, price, mrp, images, stock")
        .in("id", comboData.product_ids);

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error loading combo:", error);
      toast.error("Failed to load combo details");
    } finally {
      setLoading(false);
    }
  }

  const handleAddAllToCart = async () => {
    if (!products.length) return;

    try {
      for (const product of products) {
        await addItem({
          product_id: product.id,
          title: product.title,
          price: product.price,
          product_images: product.product_images,
          variant: {},
          quantity: 1,
        });
      }
      toast.success("All combo items added to cart!");
    } catch (error) {
      toast.error("Failed to add items to cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Combo not found
          </h2>
          <p className="text-gray-600 mb-6">
            This combo offer is no longer available.
          </p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const discount = Math.round(
    ((combo.original_price - combo.combo_price) / combo.original_price) * 100
  );

  const totalSavings = combo.original_price - combo.combo_price;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 md:p-12 mb-12 border border-amber-200">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-3 rounded-xl">
                <Package className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <span className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold mb-2">
                  {discount}% OFF
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {combo.title}
                </h1>
              </div>
            </div>
          </div>

          <p className="text-lg text-gray-700 mb-6">{combo.description}</p>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-red-600">
                  {formatCurrency(combo.combo_price)}
                </span>
                <span className="text-2xl text-gray-400 line-through">
                  {formatCurrency(combo.original_price)}
                </span>
              </div>
              <p className="text-green-600 font-semibold text-lg">
                Save {formatCurrency(totalSavings)} on this combo!
              </p>
              <p className="text-sm text-gray-600">
                {products.length} products included
              </p>
            </div>

            <button
              onClick={handleAddAllToCart}
              className="btn btn-primary flex items-center gap-2 text-lg px-8 py-4"
            >
              <ShoppingCart className="w-6 h-6" />
              Add All to Cart
            </button>
          </div>

          {combo.valid_to && (
            <div className="mt-6 pt-6 border-t border-amber-200">
              <p className="text-sm text-gray-600">
                Offer valid until{" "}
                {new Date(combo.valid_to).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <ArrowRight className="w-6 h-6 text-red-600" />
            Products in this Combo
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
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
                  image={product.product_images[0].image_url}
                  inStock={product.stock > 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No products found in this combo</p>
          </div>
        )}
      </div>
    </div>
  );
}
