import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Check, X, Eye, Wallet } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

interface Seller {
  id: string;
  shop_name: string;
  status: string;
  kyc: any;
  seller_wallet_balance: number;
  commission_rate: number;
  rejection_reason?: string;
  approved_at?: string;
  created_at: string;
  users?: {
    email: string;
    name: string;
    phone: string;
  };
}

export default function AdminSellers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from("sellers")
        .select("*, users:sellers_id_fkey(email, name, phone)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast({
        title: "Error",
        description: "Failed to load sellers",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSeller) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        toast({
          title: "Error",
          description: "Session expired",
          variant: "error",
        });
        return;
      }

      const apiUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/seller-approval`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seller_id: selectedSeller.id,
          action: "approve",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to approve seller");
      }

      toast({
        title: "Success",
        description: "Seller approved successfully",
        variant: "success",
      });
      setShowApprovalModal(false);
      setSelectedSeller(null);
      fetchSellers();
    } catch (error: any) {
      console.error("Error approving seller:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve seller",
        variant: "error",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedSeller || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "error",
      });
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        toast({
          title: "Error",
          description: "Session expired",
          variant: "error",
        });
        return;
      }

      const apiUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/seller-approval`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seller_id: selectedSeller.id,
          action: "reject",
          rejection_reason: rejectionReason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reject seller");
      }

      toast({
        title: "Success",
        description: "Seller rejected successfully",
        variant: "success",
      });
      setShowRejectModal(false);
      setSelectedSeller(null);
      setRejectionReason("");
      fetchSellers();
    } catch (error: any) {
      console.error("Error rejecting seller:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject seller",
        variant: "error",
      });
    }
  };

  const handleCreditWallet = async () => {
    if (!selectedSeller || !creditAmount || Number(creditAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "error",
      });
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        toast({
          title: "Error",
          description: "Session expired",
          variant: "error",
        });
        return;
      }

      const apiUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/wallet-transaction`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seller_id: selectedSeller.id,
          type: "credit",
          amount: Number(creditAmount),
          description: creditDescription || "Admin credit",
          reference_type: "admin_credit",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to credit wallet");
      }

      toast({
        title: "Success",
        description: "Wallet credited successfully",
        variant: "success",
      });
      setShowCreditModal(false);
      setSelectedSeller(null);
      setCreditAmount("");
      setCreditDescription("");
      fetchSellers();
    } catch (error: any) {
      console.error("Error crediting wallet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to credit wallet",
        variant: "error",
      });
    }
  };

  const updateSellerStatus = async (sellerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ status: newStatus })
        .eq("id", sellerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Seller ${newStatus} successfully`,
        variant: "success",
      });
      fetchSellers();
    } catch (error) {
      console.error("Error updating seller:", error);
      toast({
        title: "Error",
        description: "Failed to update seller status",
        variant: "error",
      });
    }
  };

  const openApprovalModal = (seller: Seller) => {
    setSelectedSeller(seller);
    setShowApprovalModal(true);
  };

  const openRejectModal = (seller: Seller) => {
    setSelectedSeller(seller);
    setShowRejectModal(true);
  };

  const openCreditModal = (seller: Seller) => {
    setSelectedSeller(seller);
    setShowCreditModal(true);
  };

  const filteredSellers =
    statusFilter === "all"
      ? sellers
      : sellers.filter((seller) => seller.status === statusFilter);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
      rejected: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

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
        <h1 className="text-3xl font-bold mb-4">Seller Management</h1>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === "all"
                ? "bg-red-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            All Sellers
          </button>
          {["pending", "approved", "suspended", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize ${
                statusFilter === status
                  ? "bg-red-800 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wallet Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {seller.shop_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {seller.users?.name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {seller.users?.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {seller.users?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(
                          seller.status
                        )}`}
                      >
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{seller.seller_wallet_balance?.toFixed(2) || "0.00"}
                      </div>
                      <button
                        onClick={() => openCreditModal(seller)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                      >
                        <Wallet size={12} /> Credit Wallet
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(seller.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {seller.status === "pending" && (
                          <>
                            <button
                              onClick={() => openApprovalModal(seller)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => openRejectModal(seller)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {seller.status === "approved" && (
                          <button
                            onClick={() =>
                              updateSellerStatus(seller.id, "suspended")
                            }
                            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                          >
                            Suspend
                          </button>
                        )}
                        {seller.status === "suspended" && (
                          <button
                            onClick={() =>
                              updateSellerStatus(seller.id, "approved")
                            }
                            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredSellers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No sellers found</div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={handleApprove}
        title="Approve Seller"
        message={`Are you sure you want to approve ${selectedSeller?.shop_name}? This will grant them access to the seller dashboard.`}
        confirmText="Approve"
        confirmVariant="success"
      />

      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason("");
        }}
        title="Reject Seller Application"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              placeholder="Provide a detailed reason for rejection..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reject Seller
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreditModal}
        onClose={() => {
          setShowCreditModal(false);
          setCreditAmount("");
          setCreditDescription("");
        }}
        title="Credit Seller Wallet"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shop Name
            </label>
            <div className="text-gray-900 font-medium">
              {selectedSeller?.shop_name}
            </div>
            <div className="text-sm text-gray-500">
              Current Balance: ₹
              {selectedSeller?.seller_wallet_balance?.toFixed(2) || "0.00"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              placeholder="Enter amount to credit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={creditDescription}
              onChange={(e) => setCreditDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              rows={3}
              placeholder="Optional description for this credit"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowCreditModal(false);
                setCreditAmount("");
                setCreditDescription("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreditWallet}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Credit Wallet
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
