import { useState, useEffect } from "react";

interface RecentProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  viewedAt: number;
}

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 12;

export function useRecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    loadRecentProducts();
  }, []);

  const loadRecentProducts = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const products = JSON.parse(stored);
        setRecentProducts(products);
      }
    } catch (error) {
      console.error("Error loading recent products:", error);
    }
  };

  const addRecentProduct = (product: Omit<RecentProduct, "viewedAt">) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let products: RecentProduct[] = stored ? JSON.parse(stored) : [];

      products = products.filter((p) => p.id !== product.id);

      products.unshift({
        ...product,
        viewedAt: Date.now(),
      });

      if (products.length > MAX_ITEMS) {
        products = products.slice(0, MAX_ITEMS);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      setRecentProducts(products);
    } catch (error) {
      console.error("Error saving recent product:", error);
    }
  };

  const deleteRecentProduct = (id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      let products: RecentProduct[] = JSON.parse(stored);
      products = products.filter((p) => p.id !== id);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      setRecentProducts(products);
    } catch (error) {
      console.error("Error deleting recent product:", error);
    }
  };

  const clearRecentProducts = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecentProducts([]);
    } catch (error) {
      console.error("Error clearing recent products:", error);
    }
  };

  return {
    recentProducts,
    addRecentProduct,
    deleteRecentProduct,
    clearRecentProducts,
  };
}
