import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/useToast";
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";

interface BankAccount {
  id: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name?: string;
  account_type: "savings" | "current";
  is_default: boolean;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
}

export default function SellerBankAccounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
    null
  );

  const [formData, setFormData] = useState({
    account_holder: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    branch_name: "",
    account_type: "savings" as "savings" | "current",
    is_default: false,
  });

  useEffect(() => {
    loadSellerAndAccounts();
  }, [user]);

  const loadSellerAndAccounts = async () => {
    if (!user) return;

    try {
      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (seller) {
        setSellerId(seller.id);
        await fetchAccounts(seller.id);
      }
    } catch (error) {
      console.error("Error loading seller:", error);
      toast({
        title: "Error",
        description: "Failed to load seller data",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async (sellerIdParam?: string) => {
    const id = sellerIdParam || sellerId;
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("seller_bank_accounts")
        .select("*")
        .eq("seller_id", id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        variant: "error",
      });
    }
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setFormData({
      account_holder: "",
      account_number: "",
      ifsc_code: "",
      bank_name: "",
      branch_name: "",
      account_type: "savings",
      is_default: accounts.length === 0,
    });
    setShowModal(true);
  };

  const openEditModal = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      account_holder: account.account_holder,
      account_number: account.account_number,
      ifsc_code: account.ifsc_code,
      bank_name: account.bank_name,
      branch_name: account.branch_name || "",
      account_type: account.account_type,
      is_default: account.is_default,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sellerId) {
      toast({
        title: "Error",
        description: "Seller account not found",
        variant: "error",
      });
      return;
    }

    if (
      !formData.account_holder ||
      !formData.account_number ||
      !formData.ifsc_code ||
      !formData.bank_name
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "error",
      });
      return;
    }

    try {
      const accountData = {
        seller_id: sellerId,
        account_holder: formData.account_holder,
        account_number: formData.account_number,
        ifsc_code: formData.ifsc_code.toUpperCase(),
        bank_name: formData.bank_name,
        branch_name: formData.branch_name || null,
        account_type: formData.account_type,
        is_default: formData.is_default,
      };

      if (editingAccount) {
        const { error } = await supabase
          .from("seller_bank_accounts")
          .update(accountData)
          .eq("id", editingAccount.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Bank account updated successfully",
          variant: "success",
        });
      } else {
        const { error } = await supabase
          .from("seller_bank_accounts")
          .insert(accountData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Bank account added successfully",
          variant: "success",
        });
      }

      setShowModal(false);
      fetchAccounts();
    } catch (error: any) {
      console.error("Error saving account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save bank account",
        variant: "error",
      });
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;

    try {
      const { error } = await supabase
        .from("seller_bank_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bank account deleted successfully",
        variant: "success",
      });
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete bank account",
        variant: "error",
      });
    }
  };

  const setDefaultAccount = async (accountId: string) => {
    if (!sellerId) return;

    try {
      const { error } = await supabase
        .from("seller_bank_accounts")
        .update({ is_default: true })
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default account updated",
        variant: "success",
      });
      fetchAccounts();
    } catch (error) {
      console.error("Error setting default:", error);
      toast({
        title: "Error",
        description: "Failed to set default account",
        variant: "error",
      });
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return "*".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!sellerId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Seller account not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Bank Accounts</h1>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
          >
            <Plus size={20} />
            Add Bank Account
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white rounded-lg shadow-sm border-2 hover:shadow-md transition-shadow p-6 ${
                account.is_default ? "border-red-800" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-red-800" size={24} />
                  <div>
                    <h3 className="font-bold text-lg">{account.bank_name}</h3>
                    {account.branch_name && (
                      <p className="text-sm text-gray-600">
                        {account.branch_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {account.is_default && (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                      Default
                    </span>
                  )}
                  {account.is_verified ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-gray-400" size={20} />
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Account Holder</p>
                  <p className="font-medium">{account.account_holder}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Account Number</p>
                  <p className="font-mono font-medium">
                    {maskAccountNumber(account.account_number)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-600">IFSC Code</p>
                    <p className="font-mono text-sm font-medium">
                      {account.ifsc_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Type</p>
                    <p className="text-sm font-medium capitalize">
                      {account.account_type}
                    </p>
                  </div>
                </div>
                {account.is_verified && account.verified_at && (
                  <div>
                    <p className="text-xs text-green-600">
                      Verified on{" "}
                      {new Date(account.verified_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!account.is_default && (
                  <button
                    onClick={() => setDefaultAccount(account.id)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => openEditModal(account)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                {!account.is_default && (
                  <button
                    onClick={() => deleteAccount(account.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CreditCard className="mx-auto mb-4 text-gray-300" size={48} />
            <p>
              No bank accounts added yet. Add your first bank account for
              withdrawals!
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAccount ? "Edit Bank Account" : "Add Bank Account"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name *
            </label>
            <input
              type="text"
              value={formData.account_holder}
              onChange={(e) =>
                setFormData({ ...formData, account_holder: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              placeholder="Full name as per bank"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) =>
                setFormData({ ...formData, account_number: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              placeholder="Account number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IFSC Code *
            </label>
            <input
              type="text"
              value={formData.ifsc_code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ifsc_code: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              placeholder="IFSC code"
              maxLength={11}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name *
            </label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) =>
                setFormData({ ...formData, bank_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              placeholder="Bank name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Name
            </label>
            <input
              type="text"
              value={formData.branch_name}
              onChange={(e) =>
                setFormData({ ...formData, branch_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              placeholder="Branch name (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type *
            </label>
            <select
              value={formData.account_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  account_type: e.target.value as "savings" | "current",
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              required
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) =>
                setFormData({ ...formData, is_default: e.target.checked })
              }
              className="w-4 h-4 text-red-800 border-gray-300 rounded focus:ring-red-800"
            />
            <label
              htmlFor="is_default"
              className="text-sm font-medium text-gray-700"
            >
              Set as default account for withdrawals
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
            >
              {editingAccount ? "Update Account" : "Add Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
