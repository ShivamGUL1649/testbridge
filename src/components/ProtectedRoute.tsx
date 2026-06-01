import { Navigate } from "react-router-dom";
import Loading from "./Loading";
import type { UserProfile, UserRole } from "../types";

interface ProtectedRouteProps {
  profile: UserProfile | null;
  isLoading: boolean;
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function ProtectedRoute({
  profile,
  isLoading,
  allowedRoles,
  children
}: ProtectedRouteProps) {
  if (isLoading) {
    return <Loading />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    if (profile.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (profile.role === "TUTOR") {
      return <Navigate to="/tutor/dashboard" replace />;
    }

    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
}