import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../hooks/useToast";
import { formatCurrency } from "../../utils/format";
import { Calendar, Filter, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
}

interface AffiliateRelations {
  id: string;
  product: Product;
  status: "pending" | "success" | "credited" | "cancelled";
  commission_rate: number;
  commission_value: number;
  created_at: string;
  updated_at: string;
}

export function AffiliateRefferals() {
  const { affiliateUser } = useAuth();
  const toast = useToast();

  const [refferals, setRefferals] = useState<AffiliateRelations[]>([]);
  const [filtered, setFiltered] = useState<AffiliateRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchRefferals = async () => {
    if (!affiliateUser) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("affiliate_relations")
        .select(
          `
          id,
          created_at,
          updated_at,
          status,
          commission_rate,
          commission_value,
          product:product_id (
            id,
            title,
            slug,
            price
          )
        `
        )
        .eq("affiliate_id", affiliateUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRefferals(data || []);
      setFiltered(data || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefferals();
  }, [affiliateUser]);

  useEffect(() => {
    let filteredList = refferals;

    // Apply date range
    if (dateFilter.from || dateFilter.to) {
      filteredList = filteredList.filter((r) => {
        const date = new Date(r.created_at).getTime();
        const from = dateFilter.from ? new Date(dateFilter.from).getTime() : 0;
        const to = dateFilter.to ? new Date(dateFilter.to).getTime() : Infinity;
        return date >= from && date <= to;
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filteredList = filteredList.filter((r) => r.status === statusFilter);
    }

    setFiltered(filteredList);
  }, [dateFilter, statusFilter, refferals]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      success: "bg-green-100 text-green-800",
      credited: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-gray-500 animate-pulse">Loading referrals...</div>
      </div>
    );
  }

  if (!affiliateUser) {
    return (
      <div className="text-center py-12 text-gray-500">
        Affiliate account not found. Please contact support.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-semibold">My Referrals</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) =>
                setDateFilter((prev) => ({ ...prev, from: e.target.value }))
              }
              className="border rounded-md px-2 py-1 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) =>
                setDateFilter((prev) => ({ ...prev, to: e.target.value }))
              }
              className="border rounded-md px-2 py-1 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="credited">Credited</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={fetchRefferals}
            className="flex items-center gap-2 text-sm border px-3 py-1 rounded-md hover:bg-gray-100"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No referrals found for the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Commission Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Commission Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((ref) => (
                <tr key={ref.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link to={`/product/${ref.product.slug}`} className="group">
                      <div className="font-medium text-gray-900 group-hover:text-blue-500">
                        {ref.product.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ref.product.slug}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {formatCurrency(ref.product.price)}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {ref.commission_rate ? ref.commission_rate + `%` : "NA"}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {formatCurrency(ref.commission_value)}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {new Date(ref.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">{getStatusBadge(ref.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
