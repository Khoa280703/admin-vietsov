import {
  FileText,
  LayoutDashboard,
  Users,
  Shield,
  FolderTree,
  Tag,
  ChevronDown,
  ChevronRight,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import vietsovLogo from "@/assets/logo/Logo VSP mau moi nhat.png";

export type MenuItemId =
  | "create-article"
  | "dashboard"
  | "settings"
  | "users"
  | "roles"
  | "articles"
  | "categories"
  | "tags"
  | "logs";

interface MenuItem {
  id: MenuItemId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  adminOnly?: boolean;
  parent?: string;
}

interface AdminSidebarProps {
  collapsed?: boolean;
}

export function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [openMenus, setOpenMenus] = useState<Set<string>>(
    new Set(["articles", "system", "settings"])
  );

  const isAdmin = user?.role?.name === "admin";

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: t("admin.menu.dashboard", "Dashboard"),
      icon: LayoutDashboard,
    },
    {
      id: "create-article",
      label: t("admin.menu.createArticle", "Tạo bài viết"),
      icon: FileText,
      parent: "articles",
    },
    {
      id: "articles",
      label: t("admin.menu.articles", "Quản lý bài viết"),
      icon: FileText,
      parent: "articles",
    },
    {
      id: "users",
      label: t("admin.menu.users", "Quản lý người dùng"),
      icon: Users,
      adminOnly: true,
      parent: "system",
    },
    {
      id: "roles",
      label: t("admin.menu.roles", "Phân quyền"),
      icon: Shield,
      adminOnly: true,
      parent: "system",
    },
    {
      id: "logs",
      label: t("admin.menu.logs", "Logs"),
      icon: FileSearch,
      adminOnly: true,
      parent: "system",
    },
    {
      id: "categories",
      label: t("admin.menu.categories", "Danh mục"),
      icon: FolderTree,
      adminOnly: true,
      parent: "settings",
    },
    {
      id: "tags",
      label: t("admin.menu.tags", "Thẻ"),
      icon: Tag,
      adminOnly: true,
      parent: "settings",
    },
  ];

  const handleItemClick = (itemId: MenuItemId) => {
    // Navigate based on menu item
    switch (itemId) {
      case "create-article":
        navigate("/editor");
        break;
      case "dashboard":
        navigate("/dashboard");
        break;
      case "articles":
        navigate("/articles");
        break;
      case "users":
        navigate("/users");
        break;
      case "roles":
        navigate("/roles");
        break;
      case "categories":
        navigate("/categories");
        break;
      case "tags":
        navigate("/tags");
        break;
      case "logs":
        navigate("/logs");
        break;
      default:
        break;
    }
  };

  // Determine active item from location
  const currentActiveItem =
    location.pathname === "/editor"
      ? "create-article"
      : location.pathname === "/dashboard"
      ? "dashboard"
      : location.pathname.startsWith("/articles")
      ? "articles"
      : location.pathname === "/users"
      ? "users"
      : location.pathname === "/roles"
      ? "roles"
      : location.pathname === "/categories"
      ? "categories"
      : location.pathname === "/tags"
      ? "tags"
      : location.pathname === "/logs"
      ? "logs"
      : "create-article";

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // Group menu items by parent
  const articlesItems = menuItems.filter((item) => item.parent === "articles");
  const systemItems = menuItems.filter((item) => item.parent === "system");
  const settingsItems = menuItems.filter((item) => item.parent === "settings");
  const standaloneItems = menuItems.filter((item) => !item.parent);

  const renderMenuItem = (item: MenuItem) => {
    // Hide admin-only items for non-admin users
    if (item.adminOnly && !isAdmin) {
      return null;
    }

    const Icon = item.icon;
    const isActive = currentActiveItem === item.id;

    return (
      <Button
        key={item.id}
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 h-10",
          collapsed && "justify-center px-0",
          isActive && "bg-gray-200 font-medium hover:bg-gray-200",
          item.parent && "ml-4"
        )}
        onClick={() => !item.disabled && handleItemClick(item.id)}
        disabled={item.disabled}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Button>
    );
  };

  const renderMenuGroup = (
    groupId: string,
    title: string,
    items: MenuItem[]
  ) => {
    if (items.length === 0) return null;
    if (items.some((item) => item.adminOnly && !isAdmin)) {
      // Check if all items are admin-only and user is not admin
      if (items.every((item) => item.adminOnly) && !isAdmin) {
        return null;
      }
    }

    const isOpen = openMenus.has(groupId);

    if (collapsed) {
      return (
        <div key={groupId} className="space-y-1">
          {items.map(renderMenuItem)}
        </div>
      );
    }

    return (
      <Collapsible
        key={groupId}
        open={isOpen}
        onOpenChange={() => toggleMenu(groupId)}
        className="space-y-1"
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-10 px-3">
            <span className="font-medium">{title}</span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1">
          {items.map(renderMenuItem)}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64",
        "md:relative md:z-auto"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-center px-4">
          <img
            src={vietsovLogo}
            alt="Vietsov Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {renderMenuGroup(
            "articles",
            t("admin.menuGroup.articles", "Bài viết"),
            articlesItems
          )}
          {renderMenuGroup(
            "system",
            t("admin.menuGroup.system", "Quản trị hệ thống"),
            systemItems
          )}
          {renderMenuGroup(
            "settings",
            t("admin.menuGroup.settings", "Thiết lập"),
            settingsItems
          )}
          {standaloneItems.map(renderMenuItem)}
        </nav>
      </div>
    </div>
  );
}

export default AdminSidebar;
