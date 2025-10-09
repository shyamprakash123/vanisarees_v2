import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { formatCurrency } from "../../utils/format";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  walletBalance: number;
  revenueChange: number;
  ordersChange: number;
  topProducts: Array<{
    product_id: string;
    product_title: string;
    order_count: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export function SellerAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    loadSellerInfo();
  }, [user]);

  useEffect(() => {
    if (sellerId) {
      fetchAnalytics();
    }
  }, [sellerId, dateRange]);

  const loadSellerInfo = async () => {
    if (!user) return;

    try {
      const { data: seller } = await supabase
        .from("sellers")
        .select("id, seller_wallet_balance")
        .eq("id", user.id)
        .maybeSingle();

      if (seller) {
        setSellerId(seller.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading seller info:", error);
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!sellerId) return;

    try {
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", sellerId)
        .gte("created_at", startDate.toISOString());

      if (ordersError) throw ordersError;

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, title")
        .eq("seller_id", sellerId);

      if (productsError) throw productsError;

      const { data: seller } = await supabase
        .from("sellers")
        .select("seller_wallet_balance")
        .eq("id", sellerId)
        .single();

      const completedOrders =
        orders?.filter((o) => o.status === "delivered") || [];
      const pendingOrders =
        orders?.filter((o) =>
          ["paid", "confirmed", "processing", "shipped"].includes(o.status)
        ) || [];

      const totalRevenue = completedOrders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );
      const totalOrders = orders?.length || 0;
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysAgo);

      const { data: prevOrders } = await supabase
        .from("orders")
        .select("total, status")
        .eq("seller_id", sellerId)
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      const prevRevenue =
        prevOrders?.reduce(
          (sum, o) => (o.status === "delivered" ? sum + Number(o.total) : sum),
          0
        ) || 0;
      const revenueChange =
        prevRevenue > 0
          ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
          : 0;
      const ordersChange = prevOrders?.length
        ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100
        : 0;

      const productSales = new Map<
        string,
        { title: string; count: number; revenue: number }
      >();
      orders?.forEach((order) => {
        if (Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const existing = productSales.get(item.product_id) || {
              title: item.title,
              count: 0,
              revenue: 0,
            };
            existing.count += item.quantity;
            existing.revenue += item.price * item.quantity;
            productSales.set(item.product_id, existing);
          });
        }
      });

      const topProducts = Array.from(productSales.entries())
        .map(([product_id, data]) => ({
          product_id,
          product_title: data.title,
          order_count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const revenueByMonth = new Map<
        string,
        { revenue: number; orders: number }
      >();
      completedOrders.forEach((order) => {
        const month = new Date(order.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        const existing = revenueByMonth.get(month) || { revenue: 0, orders: 0 };
        existing.revenue += Number(order.total);
        existing.orders += 1;
        revenueByMonth.set(month, existing);
      });

      const ordersByStatus = new Map<string, number>();
      orders?.forEach((order) => {
        ordersByStatus.set(
          order.status,
          (ordersByStatus.get(order.status) || 0) + 1
        );
      });

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalProducts: products?.length || 0,
        averageOrderValue,
        pendingOrders: pendingOrders.length,
        completedOrders: completedOrders.length,
        walletBalance: seller?.seller_wallet_balance || 0,
        revenueChange,
        ordersChange,
        topProducts,
        revenueByMonth: Array.from(revenueByMonth.entries()).map(
          ([month, data]) => ({
            month,
            ...data,
          })
        ),
        ordersByStatus: Array.from(ordersByStatus.entries()).map(
          ([status, count]) => ({
            status,
            count,
          })
        ),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (!sellerId || !analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Unable to load analytics data.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(analytics.totalRevenue),
      icon: DollarSign,
      color: "bg-green-500",
      change: analytics.revenueChange,
    },
    {
      title: "Total Orders",
      value: analytics.totalOrders.toString(),
      icon: ShoppingCart,
      color: "bg-blue-500",
      change: analytics.ordersChange,
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(analytics.averageOrderValue),
      icon: TrendingUp,
      color: "bg-purple-500",
      change: null,
    },
    {
      title: "Wallet Balance",
      value: formatCurrency(analytics.walletBalance),
      icon: DollarSign,
      color: "bg-amber-500",
      change: null,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {card.change !== null && (
                    <div
                      className={`flex items-center gap-1 text-sm font-semibold ${
                        card.change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {card.change >= 0 ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                      {Math.abs(card.change).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Order Status</h2>
            <div className="space-y-3">
              {analytics.ordersByStatus.map(({ status, count }) => {
                const percentage = (count / analytics.totalOrders) * 100;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{status}</span>
                      <span className="text-gray-600">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="text-blue-600" size={20} />
                  <span className="font-medium">Total Products</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {analytics.totalProducts}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="text-yellow-600" size={20} />
                  <span className="font-medium">Pending Orders</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {analytics.pendingOrders}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-green-600" size={20} />
                  <span className="font-medium">Completed Orders</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {analytics.completedOrders}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
            {analytics.topProducts.length > 0 ? (
              <div className="space-y-3">
                {analytics.topProducts.map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {product.product_title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.order_count} units sold
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(product.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No sales data yet
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Revenue by Month</h2>
            {analytics.revenueByMonth.length > 0 ? (
              <div className="space-y-3">
                {analytics.revenueByMonth.map((data) => (
                  <div
                    key={data.month}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{data.month}</div>
                      <div className="text-sm text-gray-500">
                        {data.orders} orders
                      </div>
                    </div>
                    <div className="font-bold text-green-600">
                      {formatCurrency(data.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No revenue data yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
