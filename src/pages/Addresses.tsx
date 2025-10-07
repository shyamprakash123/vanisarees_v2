import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface Address {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

export function Addresses() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: false,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Load addresses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setFormData({
      name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      is_default: false,
    });
    setShowModal(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', editingAddress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert({ ...formData, user_id: user!.id });
        if (error) throw error;
      }
      setShowModal(false);
      loadAddresses();
    } catch (error) {
      console.error('Save address error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
      loadAddresses();
    } catch (error) {
      console.error('Delete address error:', error);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading addresses...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No addresses saved</h2>
          <p className="text-gray-500 mb-6">Add an address for faster checkout</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {address.is_default && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded mb-2">
                      Default
                    </span>
                  )}
                  <h3 className="font-semibold text-lg">{address.name}</h3>
                  <p className="text-gray-600 mt-1">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </p>
                  <p className="text-gray-600">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p className="text-gray-600 mt-1">Phone: {address.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(address.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
            <input
              type="text"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
            <input
              type="text"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            />
            <span className="text-sm text-gray-700">Set as default address</span>
          </label>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-red-800 text-white rounded-lg font-semibold hover:bg-red-900 transition-colors"
          >
            {editingAddress ? 'Update Address' : 'Add Address'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setDeleteId(null);
        }}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
