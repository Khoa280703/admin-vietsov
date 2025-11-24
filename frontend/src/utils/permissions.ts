export interface Permission {
  module: string;
  actions: string[];
}

export function parsePermissions(permissionsString?: string): Record<string, string[]> {
  if (!permissionsString) return {};
  try {
    return JSON.parse(permissionsString);
  } catch {
    return {};
  }
}

export function hasPermission(
  permissions: Record<string, string[]>,
  module: string,
  action: string
): boolean {
  return permissions[module]?.includes(action) ?? false;
}

export function hasAnyPermission(
  permissions: Record<string, string[]>,
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((permission) => {
    const [module, action] = permission.split(":");
    return hasPermission(permissions, module, action);
  });
}

export function formatPermission(permission: string): string {
  const [module, action] = permission.split(":");
  return `${module}:${action}`;
}

