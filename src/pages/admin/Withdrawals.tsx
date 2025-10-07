import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { Check, X, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

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
  sellers?: {
    id: string;
    shop_name: string;
    seller_wallet_balance: number;
    users?: {
      name: string;
      email: string;
    };
  };
}

export function AdminWithdrawals() {
  const toast = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_withdrawal_requests')
        .select('*, sellers(id, shop_name, seller_wallet_balance, users(name, email))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        toast.error('Session expired');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seller-withdrawal`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedWithdrawal.id,
          action: 'approve',
          notes: notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve withdrawal');
      }

      toast.success('Withdrawal approved successfully');
      setShowApproveModal(false);
      setSelectedWithdrawal(null);
      setNotes('');
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      toast.error(error.message || 'Failed to approve withdrawal');
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
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
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedWithdrawal.id,
          action: 'reject',
          rejection_reason: rejectionReason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject withdrawal');
      }

      toast.success('Withdrawal rejected successfully');
      setShowRejectModal(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      toast.error(error.message || 'Failed to reject withdrawal');
    }
  };

  const handleComplete = async () => {
    if (!selectedWithdrawal || !transactionId.trim()) {
      toast.error('Please provide a transaction ID');
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
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedWithdrawal.id,
          action: 'complete',
          transaction_id: transactionId,
          notes: notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete withdrawal');
      }

      toast.success('Withdrawal completed successfully');
      setShowCompleteModal(false);
      setSelectedWithdrawal(null);
      setTransactionId('');
      setNotes('');
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error completing withdrawal:', error);
      toast.error(error.message || 'Failed to complete withdrawal');
    }
  };

  const filteredWithdrawals =
    statusFilter === 'all'
      ? withdrawals
      : withdrawals.filter((w) => w.status === statusFilter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'approved':
        return <Clock className="h-5 w-5 text-blue-600" />;
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
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Withdrawal Requests</h1>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === 'all'
                ? 'bg-red-800 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            All Requests
          </button>
          {['pending', 'approved', 'completed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize ${
                statusFilter === status
                  ? 'bg-red-800 text-white'
                  : 'bg-gray-100 text-gray-700'
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
                    Seller
                  </th>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {withdrawal.sellers?.shop_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {withdrawal.sellers?.users?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Balance: ₹{withdrawal.sellers?.seller_wallet_balance?.toFixed(2)}
                      </div>
                    </td>
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
                      {withdrawal.transaction_id && (
                        <div className="text-xs text-gray-600 mt-1">
                          TXN: {withdrawal.transaction_id}
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
                        {withdrawal.bank_details?.account_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        IFSC: {withdrawal.bank_details?.ifsc_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(withdrawal.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowApproveModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowRejectModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowCompleteModal(true);
                            }}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center gap-1"
                          >
                            <DollarSign size={12} />
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredWithdrawals.length === 0 && (
          <div className="text-center py-8 text-gray-500">No withdrawal requests found</div>
        )}
      </div>

      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setNotes('');
        }}
        title="Approve Withdrawal Request"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Seller</div>
            <div className="font-medium">{selectedWithdrawal?.sellers?.shop_name}</div>
            <div className="text-sm text-gray-600 mt-2">Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              ₹{selectedWithdrawal?.amount.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows={3}
              placeholder="Add any notes..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowApproveModal(false);
                setNotes('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Approve Request
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
        title="Reject Withdrawal Request"
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
                setRejectionReason('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reject Request
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setTransactionId('');
          setNotes('');
        }}
        title="Complete Withdrawal"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              ₹{selectedWithdrawal?.amount.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Transaction ID *
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter bank transaction ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add any notes..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowCompleteModal(false);
                setTransactionId('');
                setNotes('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Complete Withdrawal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
