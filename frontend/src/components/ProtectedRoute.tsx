import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role
  if (requiredRole && user.role?.name !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Check permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const permissions = user.role?.permissions
      ? JSON.parse(user.role.permissions)
      : {};

    const hasPermission = requiredPermissions.some((permission) => {
      const [module, action] = permission.split(":");
      return permissions[module]?.includes(action);
    });

    if (!hasPermission) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

