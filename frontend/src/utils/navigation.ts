import type { AuthUser } from "@/contexts/AuthContext";

export const getDefaultRoute = (user?: AuthUser | null) => {
  if (user?.role?.name === "admin") {
    return "/dashboard";
  }
  return "/articles";
};

