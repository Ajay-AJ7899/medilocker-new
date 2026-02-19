import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "patient" | "doctor" | "admin";

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { roles, isLoading } = useAuth();

  if (isLoading) return null;

  const hasAccess = roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
