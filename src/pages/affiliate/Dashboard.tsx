import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Tag,
  BarChart,
  IndianRupee,
  Handshake,
  Loader2,
  Clock,
  Check,
  Banknote,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency } from "../../utils/format";
import Button from "@/components/ui/Button";

interface Stats {
  totalRefferals: number;
  pendingRefferals: number;
  successRefferals: number;
  creditedRefferals: number;
  cancelledRefferals: number;
  totalRevenue: number;
}

export default function AffiliateDashboard() {
  const { user, affiliateUser, handleAffiliateJoin, affiliateLoading } =
    useAuth();
  const [stats, setStats] = useState<Stats>({
    totalRefferals: 0,
    pendingRefferals: 0,
    successRefferals: 0,
    creditedRefferals: 0,
    cancelledRefferals: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAffiliateData();
  }, [user]);

  async function loadAffiliateData() {
    if (!user) return;

    try {
      if (!affiliateUser) {
        setLoading(false);
        return;
      }

      const affiliateRes = await supabase
        .from("affiliate_relations")
        .select("id, commission_value, status")
        .eq("affiliate_id", affiliateUser.id);

      const affiliate_relations = affiliateRes.data || [];

      const totalRevenue = affiliate_relations.reduce(
        (sum, rellation) => sum + Number(rellation.commission_value),
        0
      );
      const pendingRefferals = affiliate_relations.filter(
        (o) => o.status === "pending"
      ).length;

      const successRefferals = affiliate_relations.filter(
        (o) => o.status === "success"
      ).length;

      const creditedRefferals = affiliate_relations.filter(
        (o) => o.status === "credited"
      ).length;

      const cancelledRefferals = affiliate_relations.filter(
        (o) => o.status === "cancelled"
      ).length;

      setStats({
        totalRefferals: affiliate_relations.length,
        pendingRefferals: pendingRefferals,
        successRefferals: successRefferals,
        creditedRefferals: creditedRefferals,
        cancelledRefferals: cancelledRefferals,
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      console.error("Error loading seller data:", error);
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

  if (!affiliateUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Handshake className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Affiliate Account Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              You need to Join for a affiliate partner program to access this
              dashboard.
            </p>
            <Button variant="primary" size="md" onClick={handleAffiliateJoin}>
              {affiliateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-nowrap">Joining...</span>
                </>
              ) : (
                <span className="text-nowrap">Join as Affiliate Partner</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (affiliateUser.status === "suspended") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Package className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Suspended
            </h2>
            <p className="text-gray-600">
              Your Affiliate Account has been suspended. Please contact support
              for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Refferal",
      value: stats.totalRefferals.toString(),
      icon: Package,
      color: "bg-red-600",
      link: "/affiliate/refferals",
    },
    {
      title: "Pending",
      value: stats.pendingRefferals.toString(),
      icon: Clock,
      color: "bg-yellow-500",
      link: "/affiliate/refferals?status=pending",
    },
    {
      title: "Success",
      value: stats.successRefferals.toString(),
      icon: Check,
      color: "bg-teal-500",
      link: "/affiliate/refferals?status=pending",
    },
    {
      title: "Credited",
      value: stats.creditedRefferals.toString(),
      icon: Banknote,
      color: "bg-green-500",
      link: "/affiliate/refferals?status=pending",
    },
    {
      title: "Cancelled",
      value: stats.cancelledRefferals.toString(),
      icon: X,
      color: "bg-red-500",
      link: "/affiliate/refferals?status=pending",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: IndianRupee,
      color: "bg-green-500",
      link: "",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Affiliate Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Welcome back, Affiliate!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 mb-8">
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

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/affiliate/refferals"
              className="p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-red-600" />
                <span className="font-medium">Manage Refferals</span>
              </div>
            </Link>
            <Link
              to="/affiliate/withdrawals"
              className="p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <IndianRupee className="w-5 h-5 text-red-600" />
                <span className="font-medium">Withdrawals</span>
              </div>
            </Link>
            {/* <Link
              to="/affiliate/settings"
              className="p-4 border rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-red-600" />
                <span className="font-medium">Affiliate Settings</span>
              </div>
            </Link> */}
          </div>
        </div>
      </div>
    </div>
  );
}
