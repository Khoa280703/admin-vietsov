import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface RequireRoleProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  fallback?: ReactNode;
}

export function RequireRole({
  children,
  requiredRole,
  requiredPermissions,
  fallback = null,
}: RequireRoleProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check role
  if (requiredRole && user.role?.name !== requiredRole) {
    return <>{fallback}</>;
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
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

