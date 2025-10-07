import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email address');
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, subscribed_at: new Date().toISOString() });

      if (error) {
        if (error.code === '23505') {
          setMessage('This email is already subscribed');
          setSuccess(false);
        } else {
          throw error;
        }
      } else {
        setMessage('Successfully subscribed to our newsletter!');
        setSuccess(true);
        setEmail('');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setMessage('Failed to subscribe. Please try again later.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-800 to-red-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">Subscribe to Our Newsletter</h3>
              <p className="text-red-100">Get updates on new collections, offers, and exclusive deals</p>
            </div>
          </div>

          <form onSubmit={handleSubscribe} className="w-full md:w-auto">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-4 py-3 rounded-lg flex-1 md:w-80 focus:ring-2 focus:ring-white focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-white text-red-800 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
                <Send className="w-4 h-4" />
              </button>
            </div>
            {message && (
              <p className={`mt-2 text-sm ${success ? 'text-green-200' : 'text-red-200'}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
