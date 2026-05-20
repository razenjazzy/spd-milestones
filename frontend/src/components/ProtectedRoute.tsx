import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPage?: string;
}

export function ProtectedRoute({ children, requireAdmin = false, requiredPage }: ProtectedRouteProps) {
  const token = localStorage.getItem("auth_token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin) {
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "admin") {
        return <Navigate to="/" replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }

  if (requiredPage) {
    try {
      const user = JSON.parse(userStr || "{}");
      if (user.role !== "admin" && !user.permissions?.pages?.includes(requiredPage)) {
        return <Navigate to="/" replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
