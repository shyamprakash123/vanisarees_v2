import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlistItems([]);
      setLoading(false);
    }
  }, [user]);

  async function loadWishlist() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setWishlistItems(data?.map(item => item.product_id) || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addToWishlist(productId: string) {
    if (!user) {
      throw new Error('Please sign in to add items to wishlist');
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: user.id, product_id: productId });

      if (error) throw error;
      setWishlistItems(prev => [...prev, productId]);
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Item already in wishlist');
      }
      throw error;
    }
  }

  async function removeFromWishlist(productId: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      setWishlistItems(prev => prev.filter(id => id !== productId));
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }

  async function toggleWishlist(productId: string) {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }

  function isInWishlist(productId: string) {
    return wishlistItems.includes(productId);
  }

  return {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
  };
}
