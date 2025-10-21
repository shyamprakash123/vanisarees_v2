import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback, useRef } from "react";

type AffiliateItem = {
  affiliate_id: string;
  product_id: string;
};

const STORAGE_KEY = "affiliate_refs";

const STORAGE_AFF_KEY = "affiliated_refs";

export function useAffiliate() {
  const { user, session } = useAuth();
  const [items, setItems] = useState<AffiliateItem[]>([]);
  const [affiliatedItems, setAffiliatedItems] = useState<AffiliateItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage only when no auth user
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } else {
      const stored = localStorage.getItem(STORAGE_AFF_KEY);
      if (stored) setAffiliatedItems(JSON.parse(stored));
      setLoaded(true);
    }
  }, [user]);

  // Save to localStorage whenever items change (only if not logged in)
  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } else {
      localStorage.setItem(STORAGE_AFF_KEY, JSON.stringify(affiliatedItems));
    }
  }, [items, affiliatedItems, user]);

  const pendingRef = useRef<Set<string>>(new Set());

  const handleAffiliateLead = useCallback(
    async (items: AffiliateItem[]) => {
      try {
        const toSend = items.filter(
          (item) =>
            !pendingRef.current.has(`${item.product_id}_${item.affiliate_id}`)
        );

        if (toSend.length === 0) return; // nothing new to send

        // mark as pending
        toSend.forEach((item) =>
          pendingRef.current.add(`${item.product_id}_${item.affiliate_id}`)
        );

        const response = await fetch(
          `${
            import.meta.env.VITE_SUPABASE_URL
          }/functions/v1/create-affiliate-relation`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              buyer_id: user?.id,
              refs: toSend,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          setAffiliatedItems((prev) => {
            const updated = [...prev];
            toSend.forEach((item) => {
              const exists = prev.find(
                (i) =>
                  i.product_id === item.product_id &&
                  i.affiliate_id === item.affiliate_id
              );
              if (!exists) {
                updated.push(item);
              }
            });
            return updated;
          });
        }
      } catch (error) {
        console.error(error || "Unknown Error");
      } finally {
        // remove from pending
        items.forEach((item) =>
          pendingRef.current.delete(`${item.product_id}_${item.affiliate_id}`)
        );
      }
    },
    [session?.access_token, user?.id]
  );

  const getByAFFProduct = useCallback(
    (productId: string, affliliatedId: string) =>
      affiliatedItems.some(
        (i) => i.product_id === productId && i.affiliate_id === affliliatedId
      ),
    [affiliatedItems]
  );

  // Add or update a product → referId
  const addOrUpdate = useCallback(
    async (productId: string, referId: string) => {
      if (!user) {
        setItems((prev) => {
          const existingIndex = prev.findIndex(
            (i) => i.product_id === productId
          );
          if (existingIndex !== -1) {
            // Update existing
            //   const updated = [...prev];
            //   updated[existingIndex].affiliate_id = referId;
            return prev;
          } else {
            // Append new
            return [...prev, { product_id: productId, affiliate_id: referId }];
          }
        });
      } else {
        if (loaded && !getByAFFProduct(productId, referId)) {
          await handleAffiliateLead([
            {
              affiliate_id: referId,
              product_id: productId,
            },
          ]);
        }
      }
    },
    [user, loaded, getByAFFProduct, handleAffiliateLead]
  );

  // Get all
  const getAll = useCallback(() => items, [items]);

  // Get one
  const getByProductId = useCallback(
    (productId: string) =>
      items.find((i) => i.product_id === productId) || null,
    [items]
  );

  // Clear all
  const clear = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    items,
    addOrUpdate,
    getAll,
    getByProductId,
    clear,
  };
}
