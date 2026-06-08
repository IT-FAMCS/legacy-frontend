import { Navigate } from "react-router";

// Redirect to home if already authenticated
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};
