import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, Building } from 'lucide-react';

export function AccountSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, phone, gstin')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      if (data) {
        setName(data.name || '');
        setPhone(data.phone || '');
        setGstin(data.gstin || '');
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({ name, phone, gstin })
        .eq('id', user!.id);

      if (error) throw error;
      setMessage('Profile updated successfully');
    } catch (error) {
      setMessage('Error updating profile');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4" />
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4" />
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Building className="h-4 w-4" />
            GSTIN (Optional)
          </label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            placeholder="Enter your GSTIN for business purchases"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">For GST invoice generation</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-red-800 text-white rounded-lg font-semibold hover:bg-red-900 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
