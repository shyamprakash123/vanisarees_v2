import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Lock } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: "admin" | "seller" | "user";
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireRole,
  redirectTo = "/auth/signin",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [user, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireRole && user.app_metadata?.role !== requireRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-800" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. This area is
            restricted to <span className="font-semibold">{requireRole}</span>{" "}
            users only.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
