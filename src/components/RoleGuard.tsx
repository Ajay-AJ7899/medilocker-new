import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "patient" | "doctor" | "admin";

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { roles, activeRole, isLoading } = useAuth();

  if (isLoading) return null;

  // Check both database roles and the currently active role
  const hasAccess =
    roles.some((role) => allowedRoles.includes(role)) ||
    (activeRole && allowedRoles.includes(activeRole));

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
