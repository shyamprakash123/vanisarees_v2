import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/format';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sellerInfo, setSellerInfo] = useState<any>(null);

  useEffect(() => {
    loadSellerData();
  }, [user]);

  async function loadSellerData() {
    if (!user) return;

    try {
      const { data: seller } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!seller) {
        setLoading(false);
        return;
      }

      setSellerInfo(seller);

      const [productsRes, ordersRes] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', seller.id),
        supabase
          .from('orders')
          .select('total, status')
          .eq('seller_id', seller.id)
          .neq('status', 'draft'),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
      });
    } catch (error) {
      console.error('Error loading seller data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sellerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Seller Account Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              You need to apply for a seller account to access this dashboard.
            </p>
            <Link
              to="/seller/apply"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Apply as Seller
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (sellerInfo.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Package className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Application Pending
            </h2>
            <p className="text-gray-600">
              Your seller application is under review. You'll be notified once it's approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sellerInfo.status === 'suspended') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Package className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Suspended
            </h2>
            <p className="text-gray-600">
              Your seller account has been suspended. Please contact support for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'bg-red-600',
      link: '/seller/products',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      link: '/seller/orders',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      icon: TrendingUp,
      color: 'bg-yellow-500',
      link: '/seller/orders?status=pending',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/seller/analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {sellerInfo.shop_name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/seller/products/new"
              className="p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-red-600" />
                <span className="font-medium">Add New Product</span>
              </div>
            </Link>
            <Link
              to="/seller/orders"
              className="p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-red-600" />
                <span className="font-medium">Manage Orders</span>
              </div>
            </Link>
            <Link
              to="/seller/products"
              className="p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-red-600" />
                <span className="font-medium">View All Products</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
