import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  DollarSign,
  Package,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";

interface Analytics {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  averageOrderValue: number;
  totalProducts: number;
  refundRate: number;
}

interface TopProduct {
  id: string;
  title: string;
  total_quantity: number;
  total_revenue: number;
}

export function AdminAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics>({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    averageOrderValue: 0,
    totalProducts: 0,
    refundRate: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const periodDate = new Date();
      periodDate.setDate(periodDate.getDate() - period);

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total, status, created_at")
        .gte("created_at", periodDate.toISOString());

      if (ordersError) throw ordersError;

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });

      if (usersError) throw usersError;

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });

      if (productsError) throw productsError;

      const paidOrders =
        orders?.filter(
          (o) =>
            o.status === "paid" ||
            o.status === "confirmed" ||
            o.status === "shipped" ||
            o.status === "delivered"
        ) || [];
      const refundedOrders =
        orders?.filter((o) => o.status === "refunded") || [];

      const totalSales = paidOrders.reduce(
        (sum, order) => sum + order.total,
        0
      );
      const totalOrders = paidOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      const refundRate =
        orders && orders.length > 0
          ? (refundedOrders.length / orders.length) * 100
          : 0;

      setAnalytics({
        totalSales,
        totalOrders,
        totalUsers: users || 0,
        averageOrderValue,
        totalProducts: products || 0,
        refundRate,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod(7)}
              className={`px-4 py-2 rounded-lg ${
                period === 7
                  ? "bg-red-800 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod(30)}
              className={`px-4 py-2 rounded-lg ${
                period === 30
                  ? "bg-red-800 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriod(90)}
              className={`px-4 py-2 rounded-lg ${
                period === 90
                  ? "bg-red-800 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              90 Days
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Sales"
            value={`₹${analytics.totalSales.toFixed(2)}`}
            icon={DollarSign}
            color="bg-green-600"
          />
          <StatCard
            title="Total Orders"
            value={analytics.totalOrders}
            icon={ShoppingCart}
            color="bg-blue-600"
          />
          <StatCard
            title="Average Order Value"
            value={`₹${analytics.averageOrderValue.toFixed(2)}`}
            icon={TrendingUp}
            color="bg-purple-600"
          />
          <StatCard
            title="Total Users"
            value={analytics.totalUsers}
            icon={Users}
            color="bg-orange-600"
          />
          <StatCard
            title="Total Products"
            value={analytics.totalProducts}
            icon={Package}
            color="bg-red-800"
          />
          <StatCard
            title="Refund Rate"
            value={`${analytics.refundRate.toFixed(2)}%`}
            icon={RefreshCw}
            color="bg-yellow-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Sales Overview</h2>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart visualization would be implemented here
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Top Products</h2>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.total_quantity} units sold
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">
                      ₹{product.total_revenue.toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No data available for this period
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">GST Report</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tax Slab
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Taxable Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tax Collected
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    GST report data would be displayed here
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-4">
            <button className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900">
              Export CSV
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
