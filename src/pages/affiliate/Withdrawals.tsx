import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/useToast";
import { Wallet, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Link } from "react-router-dom";

interface BankAccount {
  id: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name?: string;
  account_type: string;
  is_default: boolean;
  is_verified: boolean;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  bank_details: any;
  transaction_id?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
}

export function AffiliateWithdrawals() {
  const { user, affiliateUser } = useAuth();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] =
    useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      await fetchWithdrawals();
      await fetchBankAccounts();
    };

    fetchData();
  }, [user, affiliateUser]);

  const fetchWithdrawals = async () => {
    if (!user || !affiliateUser) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("affiliate_withdrawal_requests")
        .select("*")
        .eq("affiliate_id", affiliateUser?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast({
        title: "Error",
        description: "Failed to load withdrawal requests",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    if (!user || !affiliateUser) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("affiliate_bank_accounts")
        .select("*")
        .eq("affiliate_id", affiliateUser?.id)
        .order("is_default", { ascending: false });

      if (error) throw error;

      const accounts = data || [];
      setBankAccounts(accounts);

      const defaultAccount = accounts.find((acc) => acc.is_default);
      if (defaultAccount) {
        setSelectedBankAccountId(defaultAccount.id);
      } else if (accounts.length > 0) {
        setSelectedBankAccountId(accounts[0].id);
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async () => {
    if (!affiliateUser || !withdrawAmount || Number(withdrawAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "error",
      });
      return;
    }

    if (!selectedBankAccountId) {
      toast({
        title: "Error",
        description: "Please select a bank account",
        variant: "error",
      });
      return;
    }

    if (Number(withdrawAmount) > affiliateUser.wallet_balance) {
      toast({
        title: "Error",
        description: "Insufficient wallet balance",
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

      const selectedAccount = bankAccounts.find(
        (acc) => acc.id === selectedBankAccountId
      );
      if (!selectedAccount) {
        toast({
          title: "Error",
          description: "Selected bank account not found",
          variant: "error",
        });
        return;
      }

      const bankDetails = {
        account_holder: selectedAccount.account_holder,
        account_number: selectedAccount.account_number,
        ifsc_code: selectedAccount.ifsc_code,
        bank_name: selectedAccount.bank_name,
        branch_name: selectedAccount.branch_name,
        account_type: selectedAccount.account_type,
      };

      const apiUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/affiliate-withdrawal`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          bank_details: bankDetails,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create withdrawal request");
      }

      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully",
        variant: "success",
      });
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      fetchWithdrawals();
    } catch (error: any) {
      console.error("Error creating withdrawal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create withdrawal request",
        variant: "error",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "approved":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "approved":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!affiliateUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          Affiliate account not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Wallet & Withdrawals</h1>

        <div className="bg-gradient-to-br from-red-800 to-red-900 text-white p-8 rounded-lg shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 mb-2">Available Balance</p>
              <p className="text-4xl font-bold">
                ₹{affiliateUser.wallet_balance?.toFixed(2) || "0.00"}
              </p>
            </div>
            <Wallet className="h-16 w-16 text-red-200" />
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={
              !affiliateUser.wallet_balance || affiliateUser.wallet_balance <= 0
            }
            className="mt-6 px-6 py-2 bg-white text-red-800 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
            Request Withdrawal
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Withdrawal Requests</h2>
          </div>

          {withdrawals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No withdrawal requests yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{withdrawal.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(withdrawal.status)}
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(
                              withdrawal.status
                            )}`}
                          >
                            {withdrawal.status}
                          </span>
                        </div>
                        {withdrawal.rejection_reason && (
                          <div className="text-xs text-red-600 mt-1">
                            {withdrawal.rejection_reason}
                          </div>
                        )}
                        {withdrawal.notes && (
                          <div className="text-xs text-gray-600 mt-1">
                            {withdrawal.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {withdrawal.bank_details?.account_holder}
                        </div>
                        <div className="text-xs text-gray-500">
                          {withdrawal.bank_details?.bank_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {withdrawal.bank_details?.account_number
                            ?.slice(-4)
                            .padStart(
                              withdrawal.bank_details?.account_number.length,
                              "*"
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {withdrawal.transaction_id || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false);
          setWithdrawAmount("");
        }}
        title="Request Withdrawal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Balance
            </label>
            <div className="text-2xl font-bold text-gray-900">
              ₹{affiliateUser.wallet_balance?.toFixed(2) || "0.00"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={affiliateUser.wallet_balance}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              placeholder="Enter amount"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Bank Account
            </h3>

            {bankAccounts.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  No bank accounts found
                </p>
                <Link
                  to="/affiliate/bank-accounts"
                  className="text-sm text-red-800 hover:underline"
                >
                  Add a bank account first
                </Link>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Select Bank Account *
                </label>
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                  required
                >
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} -{" "}
                      {account.account_number
                        .slice(-4)
                        .padStart(account.account_number.length, "*")}
                      {account.is_default ? " (Default)" : ""}
                      {account.is_verified ? " ✓" : ""}
                    </option>
                  ))}
                </select>
                {selectedBankAccountId &&
                  (() => {
                    const account = bankAccounts.find(
                      (acc) => acc.id === selectedBankAccountId
                    );
                    if (!account) return null;
                    return (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-xs space-y-1">
                        <p>
                          <span className="font-medium">Holder:</span>{" "}
                          {account.account_holder}
                        </p>
                        <p>
                          <span className="font-medium">IFSC:</span>{" "}
                          {account.ifsc_code}
                        </p>
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          {account.account_type}
                        </p>
                      </div>
                    );
                  })()}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setShowWithdrawModal(false);
                setWithdrawAmount("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdrawRequest}
              disabled={
                bankAccounts.length === 0 ||
                affiliateUser.wallet_balance < withdrawAmount
              }
              className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
