import { useState, useEffect } from "react";
import { Tag, Copy, Check } from "lucide-react";
import { formatCurrency } from "../../utils/format";
import { supabase } from "../../lib/supabase";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order: number;
  max_discount?: number;
  description?: string;
  valid_to: string;
}

export function OffersGrid() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("active", true)
        .or(`valid_to.gte.${new Date().toISOString()},valid_to.is.null`)
        .order("value", { ascending: false })
        .limit(4);

      if (error) throw error;
      if (data) setCoupons(data);
    } catch (error) {
      console.error("Error loading coupons:", error);
    } finally {
      setLoading(false);
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.type === "percentage") {
      return `${coupon.value}% OFF`;
    }
    return `${formatCurrency(coupon.value)} OFF`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 rounded-lg h-40"
          ></div>
        ))}
      </div>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {coupons.map((coupon, index) => (
        <div
          key={coupon.id}
          className="relative bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 hover:border-red-400 hover:shadow-lg transition-all group animate-slideUp"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="absolute -top-3 -right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            {getDiscountText(coupon)}
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="bg-red-50 p-2 rounded-lg">
              <Tag className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {coupon.description || "Special Offer"}
              </h4>
              {coupon.min_order > 0 && (
                <p className="text-xs text-gray-600">
                  Min. order: {formatCurrency(coupon.min_order)}
                </p>
              )}
              {coupon.max_discount && (
                <p className="text-xs text-gray-600">
                  Max. discount: {formatCurrency(coupon.max_discount)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="bg-gray-100 px-3 py-2 rounded font-mono font-bold text-sm text-gray-900 flex-1">
              {coupon.code}
            </div>
            <button
              onClick={() => copyCode(coupon.code)}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
              aria-label="Copy coupon code"
            >
              {copiedCode === coupon.code ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Valid until {new Date(coupon.valid_to).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
