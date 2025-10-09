import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: "user" | "seller" | "admin" | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"user" | "seller" | "admin" | null>(null);

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
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    role,
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
