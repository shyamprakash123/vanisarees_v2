import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { Wallet, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

interface Seller {
  id: string;
  seller_wallet_balance: number;
  bank_details: any;
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

export function SellerWithdrawals() {
  const { user } = useAuth();
  const toast = useToast();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_holder: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
  });

  useEffect(() => {
    fetchSellerData();
    fetchWithdrawals();
  }, [user]);

  const fetchSellerData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('id, seller_wallet_balance, bank_details')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSeller(data);
        if (data.bank_details && Object.keys(data.bank_details).length > 0) {
          setBankDetails(data.bank_details);
        }
      }
    } catch (error) {
      console.error('Error fetching seller:', error);
      toast.error('Failed to load seller data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    if (!user) return;

    try {
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!sellerData) return;

      const { data, error } = await supabase
        .from('seller_withdrawal_requests')
        .select('*')
        .eq('seller_id', sellerData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawal requests');
    }
  };

  const handleWithdrawRequest = async () => {
    if (!seller || !withdrawAmount || Number(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!bankDetails.account_holder || !bankDetails.account_number || !bankDetails.ifsc_code) {
      toast.error('Please fill in all bank details');
      return;
    }

    if (Number(withdrawAmount) > seller.seller_wallet_balance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        toast.error('Session expired');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seller-withdrawal`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seller_id: seller.id,
          amount: Number(withdrawAmount),
          bank_details: bankDetails,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create withdrawal request');
      }

      await supabase
        .from('sellers')
        .update({ bank_details: bankDetails })
        .eq('id', seller.id);

      toast.success('Withdrawal request submitted successfully');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchSellerData();
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error creating withdrawal:', error);
      toast.error(error.message || 'Failed to create withdrawal request');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'approved':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'approved':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Seller account not found</div>
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
                ₹{seller.seller_wallet_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <Wallet className="h-16 w-16 text-red-200" />
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!seller.seller_wallet_balance || seller.seller_wallet_balance <= 0}
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
                          {withdrawal.bank_details?.account_number?.slice(-4).padStart(
                            withdrawal.bank_details?.account_number.length,
                            '*'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {withdrawal.transaction_id || '-'}
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
          setWithdrawAmount('');
        }}
        title="Request Withdrawal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Balance
            </label>
            <div className="text-2xl font-bold text-gray-900">
              ₹{seller.seller_wallet_balance?.toFixed(2) || '0.00'}
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
              max={seller.seller_wallet_balance}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
              placeholder="Enter amount"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Bank Details</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={bankDetails.account_holder}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, account_holder: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                  placeholder="Full name as per bank"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={bankDetails.account_number}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, account_number: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                  placeholder="Account number"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  value={bankDetails.ifsc_code}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                  placeholder="IFSC code"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bank_name}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, bank_name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-red-800"
                  placeholder="Bank name"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setShowWithdrawModal(false);
                setWithdrawAmount('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdrawRequest}
              className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
            >
              Submit Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
