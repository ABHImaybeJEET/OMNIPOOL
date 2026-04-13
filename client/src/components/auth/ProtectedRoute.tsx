import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useStore from "../../store/useStore";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const user = useStore((state) => state.user);
  const { isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-text-secondary text-sm">
          Checking authentication...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/signin" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
