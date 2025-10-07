import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Phone, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

type AccountRole = 'user' | 'seller';

export function SignUp() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [accountType, setAccountType] = useState<AccountRole>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [gstin, setGstin] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name,
            phone,
            gstin: accountType === 'seller' ? gstin : null,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }

        if (accountType === 'seller') {
          const { error: sellerError } = await supabase
            .from('sellers')
            .insert({
              user_id: data.user.id,
              shop_name: shopName,
              status: 'pending',
              kyc: {
                gstin,
                address: shopAddress,
                phone,
              },
            });

          if (sellerError) {
            console.error('Seller application error:', sellerError);
            throw sellerError;
          }

          addToast('Seller application submitted! Awaiting admin approval.', 'success');
        } else {
          addToast('Account created successfully!', 'success');
        }

        navigate('/');
      }
    } catch (error: any) {
      addToast(error.message || 'Failed to sign up', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/auth/signin"
              className="font-medium text-red-700 hover:text-red-800"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAccountType('user')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    accountType === 'user'
                      ? 'border-red-700 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <User className={`h-6 w-6 mb-2 ${accountType === 'user' ? 'text-red-700' : 'text-gray-600'}`} />
                  <div className="font-medium">Customer</div>
                  <div className="text-xs text-gray-500 mt-1">Buy products</div>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('seller')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    accountType === 'seller'
                      ? 'border-red-700 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Store className={`h-6 w-6 mb-2 ${accountType === 'seller' ? 'text-red-700' : 'text-gray-600'}`} />
                  <div className="font-medium">Seller</div>
                  <div className="text-xs text-gray-500 mt-1">Sell products</div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="sr-only">
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-700 focus:border-red-700 focus:z-10 sm:text-sm"
                  placeholder="Full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-700 focus:border-red-700 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="sr-only">
                Phone number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-700 focus:border-red-700 focus:z-10 sm:text-sm"
                  placeholder="Phone number"
                />
              </div>
            </div>

            {accountType === 'seller' && (
              <>
                <div>
                  <label htmlFor="shopName" className="sr-only">
                    Shop name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Store className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="shopName"
                      name="shopName"
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="appearance-none relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-700 focus:border-red-700 focus:z-10 sm:text-sm"
                      placeholder="Shop name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="gstin" className="sr-only">
                    GSTIN (optional)
                  </label>
                  <input
                    id="gstin"
                    name="gstin"
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-700 focus:border-red-700 focus:z-10 sm:text-sm"
                    placeholder="GSTIN (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="shopAddress" className="sr-only">
                    Shop address
                  </label>
                  <textarea
                    id="shopAddress"
                    name="shopAddress"
                    required
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    rows={3}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-700 focus:border-red-700 focus:z-10 sm:text-sm"
                    placeholder="Shop address"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-700 focus:border-red-700 focus:z-10 sm:text-sm"
                  placeholder="Password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-red-700 focus:border-red-700 focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

          {accountType === 'seller' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Your seller application will be reviewed by our admin team. You'll receive an email once approved.
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : accountType === 'seller' ? 'Submit Application' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
