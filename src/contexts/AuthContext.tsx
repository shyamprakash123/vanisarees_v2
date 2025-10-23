import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useToast } from "@/hooks/useToast";

export interface AffiliateUser {
  id: string;
  affiliate_id: string;
  wallet_balance: number;
  status: "active" | "suspended";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: "user" | "seller" | "admin" | null;
  affiliateUser: AffiliateUser | null;
  handleAffiliateJoin: () => void;
  affiliateLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"user" | "seller" | "admin" | null>(null);
  const [affiliateUser, setAffiliateUser] = useState<AffiliateUser | null>(
    null
  );
  const [affiliateLoading, setAffiliateLoading] = useState(false);

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      setRole(data.session.user.app_metadata?.role || "user");
      setLoading(false);
    }
    return { data, error };
  };

  const handleAffiliateJoin = async () => {
    setAffiliateLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/create-affiliate-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result?.success) {
        setAffiliateUser(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error ?? result.message,
          variant: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unknown Error",
        variant: "error",
      });
    } finally {
      setAffiliateLoading(false);
    }
  };

  useEffect(() => {
    const fetchAffiliateUser = async (user: User) => {
      const { data: affiliate_user, error } = await supabase
        .from("affiliate_users")
        .select(
          `id,
            affiliate_id,
            wallet_balance`
        )
        .eq("id", user.id)
        .single();

      if (error) throw error;
      if (affiliate_user) {
        setAffiliateUser(affiliate_user as AffiliateUser);
      }
    };
    if (user) {
      fetchAffiliateUser(user);
    }
  }, [user]);

  useEffect(() => {
    // Immediately refresh session on mount
    const initAuth = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.refreshSession();

      if (!error && data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        setRole(data.session.user.app_metadata?.role || "user");
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData.session);
        setUser(sessionData.session?.user ?? null);
        setRole(sessionData.session?.user?.app_metadata?.role || "user");
      }

      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes (login/logout/refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(session?.user?.app_metadata?.role || "user");
      if (!session?.user) {
        setAffiliateUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    role,
    affiliateUser,
    handleAffiliateJoin,
    affiliateLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
