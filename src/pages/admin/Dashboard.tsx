import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  FolderTree,
  Store,
  Banknote,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../utils/format";
import AnnouncementModal from "../../components/Modals/AnnouncementModal";
import Button from "../../components/ui/Button";
import HeroImageForm from "../../components/Forms/HeroImageForm";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  averageOrderValue: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isHeroModal, setIsHeroModal] = useState<boolean>(false);
  const [isAnnouncementModal, setIsAnnouncementModal] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        supabase.from("orders").select("total, status").neq("status", "draft"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );
      const pendingOrders = orders.filter((o) => o.status === "pending").length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: productsRes.count || 0,
        totalUsers: usersRes.count || 0,
        pendingOrders,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "bg-green-500",
      link: "/admin/analytics",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "bg-blue-500",
      link: "/admin/orders",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      icon: Package,
      color: "bg-yellow-500",
      link: "/admin/orders?status=pending",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "bg-red-600",
      link: "/admin/products",
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      icon: Users,
      color: "bg-purple-500",
      link: "/admin/users",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(stats.averageOrderValue),
      icon: TrendingUp,
      color: "bg-indigo-500",
      link: "/admin/analytics",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <Button variant="primary" onClick={() => setIsHeroModal(true)}>
              Manage Hero Images
            </Button>

            <Button
              variant="primary"
              onClick={() => setIsAnnouncementModal(true)}
            >
              Manage Announcements
            </Button>
          </div>

          <p className="text-gray-600 mt-2">
            Overview of your store performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                to={card.link}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/admin/products/new"
                className="block p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Add New Product</span>
                </div>
              </Link>
              <Link
                to="/admin/categories"
                className="block p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderTree className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Manage Categories</span>
                </div>
              </Link>
              <Link
                to="/admin/orders?status=pending"
                className="block p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-red-600" />
                  <span className="font-medium">View Pending Orders</span>
                </div>
              </Link>
              <Link
                to="/admin/users"
                className="block p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Manage Users</span>
                </div>
              </Link>
              <Link
                to="/admin/sellers"
                className="block p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Manage Sellers</span>
                </div>
              </Link>
              <Link
                to="/admin/product-approvals"
                className="block p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Manage Product Approvals</span>
                </div>
              </Link>
              <Link
                to="/admin/withdrawals"
                className="block p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-red-600" />
                  <span className="font-medium">
                    Manage Affiliate Withdrawls
                  </span>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              System Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">
                  Database
                </span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">
                  Payment Gateway
                </span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">
                  Storage
                </span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Modal */}
      {isHeroModal && (
        <div
          className="fixed inset-0 bg-secondary-950/50 flex items-center justify-center z-50"
          onClick={() => setIsHeroModal(false)} // close on backdrop click
        >
          <div
            className="bg-white rounded-lg shadow-strong p-6 w-full max-w-5xl mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // prevent closing modal when clicking inside content
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl">Manage Hero Images</h2>
              <button
                type="button"
                aria-label="Close"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => setIsHeroModal(false)}
              >
                &#x2715; {/* simple cross icon */}
              </button>
            </div>

            <div className="">
              <HeroImageForm />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsHeroModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <AnnouncementModal
        isOpen={isAnnouncementModal}
        onClose={() => setIsAnnouncementModal(false)}
      />
    </div>
  );
}
