import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface SellerStatus {
  status: "pending" | "approved" | "suspended" | "rejected";
  shop_name: string;
  rejection_reason?: string;
  approved_at?: string;
}

export function SellerStatusBanner() {
  const { user, role } = useAuth();
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSellerStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("sellers")
          .select("status, shop_name, rejection_reason, approved_at")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        setSellerStatus(data);
      } catch (error) {
        console.error("Error fetching seller status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerStatus();

    const channel = supabase
      .channel("seller-status-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sellers",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setSellerStatus(payload.new as SellerStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading || !sellerStatus) return null;

  const bannerConfig = {
    pending: {
      icon: Clock,
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      iconColor: "text-amber-600",
      title: "Application Under Review",
      message:
        "Your seller application is being reviewed by our admin team. This usually takes 1-2 business days.",
    },
    approved: {
      icon: CheckCircle,
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      iconColor: "text-green-600",
      title: "Seller Account Approved",
      message: `Congratulations! Your seller account "${sellerStatus.shop_name}" has been approved. You can now start listing products.`,
    },
    rejected: {
      icon: XCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      iconColor: "text-red-600",
      title: "Application Rejected",
      message:
        sellerStatus.rejection_reason ||
        "Your seller application was rejected. Please contact support for more details.",
    },
    suspended: {
      icon: AlertCircle,
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      iconColor: "text-orange-600",
      title: "Account Suspended",
      message:
        "Your seller account has been suspended. Please contact support to resolve this issue.",
    },
  };

  const config = bannerConfig[sellerStatus.status];
  const Icon = config.icon;

  if (sellerStatus.status === "approved" && role === "seller") {
    return null;
  }

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-3">
        <Icon
          className={`${config.iconColor} mt-0.5 flex-shrink-0`}
          size={20}
        />
        <div className="flex-1">
          <h3 className={`font-semibold ${config.text} mb-1`}>
            {config.title}
          </h3>
          <p className={`text-sm ${config.text}`}>{config.message}</p>
          {sellerStatus.status === "approved" && sellerStatus.approved_at && (
            <p className={`text-xs ${config.text} mt-2`}>
              Approved on{" "}
              {new Date(sellerStatus.approved_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
