import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

export interface CartItem {
  product_id: string;
  title: string;
  price: number;
  image: string;
  tax_slab: number;
  variant: any;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  taxRate: number;
  addItem: (item: CartItem) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCartFromServer();
    } else {
      loadCartFromLocalStorage();
    }
  }, [user]);

  async function loadCartFromServer() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          "product_id, variant, quantity, products!inner(title, price, images, tax_slab)"
        )
        .eq("user_id", user.id);

      if (error) throw error;

      const serverItems: CartItem[] = (data || []).map((item) => ({
        product_id: item.product_id,
        title: (item.products as any).title,
        price: (item.products as any).price,
        image: (item.products as any).images[0],
        tax_slab: (item.products as any).tax_slab,
        variant: item.variant,
        quantity: item.quantity,
      }));

      const guestCart = loadCartFromLocalStorage();
      if (guestCart.length > 0) {
        await mergeGuestCart(guestCart);
        localStorage.removeItem("cart");
      } else {
        setItems(serverItems);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function loadCartFromLocalStorage(): CartItem[] {
    const stored = localStorage.getItem("cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed);
        setIsLoading(false);
        return parsed;
      } catch (error) {
        console.error("Error parsing cart:", error);
      }
    }
    setIsLoading(false);
    return [];
  }

  async function mergeGuestCart(guestCart: CartItem[]) {
    if (!user) return;

    try {
      for (const item of guestCart) {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("quantity")
          .eq("user_id", user.id)
          .eq("product_id", item.product_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + item.quantity })
            .eq("user_id", user.id)
            .eq("product_id", item.product_id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: item.product_id,
            variant: item.variant,
            quantity: item.quantity,
          });
        }
      }

      await loadCartFromServer();
    } catch (error) {
      console.error("Error merging guest cart:", error);
    }
  }

  function saveToLocalStorage(cartItems: CartItem[]) {
    if (!user) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }

  const addItem = async (item: CartItem) => {
    if (user) {
      try {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("quantity")
          .eq("user_id", user.id)
          .eq("product_id", item.product_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + item.quantity })
            .eq("user_id", user.id)
            .eq("product_id", item.product_id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: item.product_id,
            variant: item.variant,
            quantity: item.quantity,
          });
        }

        await loadCartFromServer();
      } catch (error) {
        console.error("Error adding to cart:", error);
        throw error;
      }
    } else {
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === item.product_id);
        const newItems = existing
          ? prev.map((i) =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          : [...prev, item];
        saveToLocalStorage(newItems);
        return newItems;
      });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    if (user) {
      try {
        const { data, error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("user_id", user.id)
          .eq("product_id", productId);

        if (error) {
          console.error("Error updating quantity:", error);
          return;
        }

        await loadCartFromServer();
      } catch (error) {
        console.error("Error updating quantity:", error);
        throw error;
      }
    } else {
      setItems((prev) => {
        const newItems = prev.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item
        );
        saveToLocalStorage(newItems);
        return newItems;
      });
    }
  };

  const removeItem = async (productId: string) => {
    if (user) {
      try {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);

        await loadCartFromServer();
      } catch (error) {
        console.error("Error removing item:", error);
        throw error;
      }
    } else {
      setItems((prev) => {
        const newItems = prev.filter((item) => item.product_id !== productId);
        saveToLocalStorage(newItems);
        return newItems;
      });
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await supabase.from("cart_items").delete().eq("user_id", user.id);

        setItems([]);
      } catch (error) {
        console.error("Error clearing cart:", error);
        throw error;
      }
    } else {
      setItems([]);
      localStorage.removeItem("cart");
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const value = {
    items,
    itemCount,
    total,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
