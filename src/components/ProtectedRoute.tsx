import { Navigate, useLocation } from "react-router";
import { useUserStore } from "../stores/user";

// Protected Route Component
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const location = useLocation();

  const token = typeof window !== 'undefined' ? localStorage.getItem("jwt_token") : null;
  
  // Check if user is authenticated (either via store or localStorage token)
  if (!token && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
