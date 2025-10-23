import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useDebounce } from "use-debounce";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "@/utils/format";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, title, slug, price, product_images(image_url)")
          .or(`title.ilike.%${debouncedQuery}%, codes.cs.{${debouncedQuery}}`)
          .limit(5);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error("Error searching products:", error);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [debouncedQuery]);

  const handleSelect = (product: any) => {
    navigate(`/product/${product.slug}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-secondary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-medium overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-secondary-600">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-secondary-100">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full p-3 flex items-center space-x-3 hover:bg-secondary-50 transition-colors text-left"
                >
                  <LazyLoadImage
                    src={product?.product_images[0]?.image_url}
                    alt={product.title}
                    effect="blur"
                    wrapperClassName="w-12 h-12 object-cover rounded-md"
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-secondary-900">
                      {product.title}
                    </h4>
                    <p className="text-sm text-primary-500">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-secondary-600">
              No products found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
