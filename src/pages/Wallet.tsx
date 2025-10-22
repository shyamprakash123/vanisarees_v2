import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatCurrency, formatDateTime } from "../utils/format";
import {
  Wallet as WalletIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function Wallet() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin");
      return;
    }
    loadWalletData();
  }, [user]);

  const loadWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        supabase
          .from("users")
          .select("wallet_balance")
          .eq("id", user!.id)
          .single(),
        supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (balanceRes.data) setBalance(balanceRes.data.wallet_balance || 0);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
    } catch (error) {
      console.error("Load wallet error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading wallet...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wallet</h1>

      <div className="bg-gradient-to-br from-red-800 to-red-900 text-white p-8 rounded-lg shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-200 mb-2">Available Balance</p>
            <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
          </div>
          <WalletIcon className="h-16 w-16 text-red-200" />
        </div>
        {/* <button className="mt-6 px-6 py-2 bg-white text-red-800 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Money
        </button> */}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions yet
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`p-3 rounded-full ${
                    txn.type === "credit" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {txn.type === "credit" ? (
                    <ArrowUpCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <ArrowDownCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {txn.description ||
                      `${txn.type === "credit" ? "Credit" : "Debit"}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(txn.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      txn.type === "credit" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {txn.type === "credit" ? "+" : "-"}
                    {formatCurrency(txn.amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Balance: {formatCurrency(txn.balance_after)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
