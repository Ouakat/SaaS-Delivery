// components/navigation/permission-nav.tsx
"use client";

import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { Icon } from "@/components/ui/icon";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  permissions: string[];
  roles?: string[];
  children?: NavItem[];
  badge?: string | number;
}

interface PermissionNavProps {
  items: NavItem[];
  className?: string;
  onItemClick?: (item: NavItem) => void;
}

// Define all navigation items with their permissions
export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "heroicons:home",
    permissions: ["dashboard.view"],
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: "heroicons:chart-bar",
    permissions: ["analytics.view"],
  },
  {
    id: "parcels",
    label: "Parcels",
    href: "/dashboard/parcels",
    icon: "heroicons:cube",
    permissions: ["parcels.view"],
    children: [
      {
        id: "parcels-list",
        label: "All Parcels",
        href: "/dashboard/parcels",
        permissions: ["parcels.view"],
      },
      {
        id: "parcels-create",
        label: "Create Parcel",
        href: "/dashboard/parcels/create",
        permissions: ["parcels.create"],
      },
      {
        id: "parcels-track",
        label: "Track Parcels",
        href: "/dashboard/parcels/track",
        permissions: ["parcels.track"],
      },
    ],
  },
  {
    id: "merchants",
    label: "Merchants",
    href: "/dashboard/merchants",
    icon: "heroicons:building-storefront",
    permissions: ["merchants.view"],
    children: [
      {
        id: "merchants-list",
        label: "All Merchants",
        href: "/dashboard/merchants",
        permissions: ["merchants.view"],
      },
      {
        id: "merchants-create",
        label: "Add Merchant",
        href: "/dashboard/merchants/create",
        permissions: ["merchants.create"],
      },
    ],
  },
  {
    id: "delivery-agents",
    label: "Delivery Agents",
    href: "/dashboard/delivery-agents",
    icon: "heroicons:truck",
    permissions: ["delivery_agents.view"],
    roles: ["admin", "manager"],
  },
  {
    id: "invoices",
    label: "Invoices",
    href: "/dashboard/invoices",
    icon: "heroicons:document-text",
    permissions: ["invoices.view"],
    children: [
      {
        id: "invoices-list",
        label: "All Invoices",
        href: "/dashboard/invoices",
        permissions: ["invoices.view"],
      },
      {
        id: "invoices-pending",
        label: "Pending",
        href: "/dashboard/invoices/pending",
        permissions: ["invoices.view"],
        badge: "pending",
      },
      {
        id: "invoices-overdue",
        label: "Overdue",
        href: "/dashboard/invoices/overdue",
        permissions: ["invoices.view"],
        badge: "overdue",
      },
    ],
  },
  {
    id: "claims",
    label: "Claims",
    href: "/dashboard/claims",
    icon: "heroicons:exclamation-triangle",
    permissions: ["claims.view"],
  },
  {
    id: "reports",
    label: "Reports",
    href: "/dashboard/reports",
    icon: "heroicons:document-chart-bar",
    permissions: ["reports.view"],
    roles: ["admin", "manager"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: "heroicons:cog-6-tooth",
    permissions: ["settings.view"],
    children: [
      {
        id: "settings-general",
        label: "General",
        href: "/dashboard/settings/general",
        permissions: ["settings.view"],
      },
      {
        id: "settings-profile",
        label: "Profile",
        href: "/dashboard/settings/profile",
        permissions: ["profile.edit"],
      },
      {
        id: "settings-notifications",
        label: "Notifications",
        href: "/dashboard/settings/notifications",
        permissions: ["settings.notifications"],
      },
      {
        id: "settings-security",
        label: "Security",
        href: "/dashboard/settings/security",
        permissions: ["settings.security"],
      },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    href: "/admin",
    icon: "heroicons:shield-check",
    permissions: ["admin.access"],
    roles: ["admin"],
    children: [
      {
        id: "admin-users",
        label: "Users",
        href: "/admin/users",
        permissions: ["users.manage"],
      },
      {
        id: "admin-tenants",
        label: "Tenants",
        href: "/admin/tenants",
        permissions: ["tenants.manage"],
      },
      {
        id: "admin-system",
        label: "System Settings",
        href: "/admin/system",
        permissions: ["system.manage"],
      },
    ],
  },
];

const PermissionNav: React.FC<PermissionNavProps> = ({
  items,
  className,
  onItemClick,
}) => {
  const { hasAnyPermission, hasAnyRole, getUserRole } = useAuth();

  const hasAccess = (item: NavItem): boolean => {
    // Check permissions
    const hasPermissions = hasAnyPermission(item.permissions);

    // Check roles if specified
    const hasRoles = item.roles ? hasAnyRole(item.roles) : true;

    return hasPermissions && hasRoles;
  };

  const getVisibleItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => hasAccess(item))
      .map((item) => ({
        ...item,
        children: item.children ? getVisibleItems(item.children) : undefined,
      }))
      .filter(
        (item) =>
          // Keep items that either have no children or have visible children
          !item.children || item.children.length > 0
      );
  };

  const visibleItems = getVisibleItems(items);

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className={cn("nav-item", `level-${level}`)}>
        <Link
          href={item.href}
          className={cn(
            "flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            level > 0 && "ml-4 px-3 py-1.5 text-xs"
          )}
          onClick={() => onItemClick?.(item)}
        >
          {item.icon && (
            <Icon
              icon={item.icon}
              className={cn(
                "mr-3 flex-shrink-0",
                level === 0 ? "w-5 h-5" : "w-4 h-4 mr-2"
              )}
            />
          )}
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "ml-2 px-2 py-1 text-xs font-medium rounded-full",
                item.badge === "pending" &&
                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                item.badge === "overdue" &&
                  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                typeof item.badge === "number" &&
                  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              )}
            >
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <Icon
              icon="heroicons:chevron-right"
              className="w-4 h-4 ml-2 text-gray-400"
            />
          )}
        </Link>

        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (visibleItems.length === 0) {
    return (
      <div className={cn("p-4", className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Icon icon="heroicons:lock-closed" className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No accessible modules</p>
          <p className="text-xs mt-1">Contact your administrator for access</p>
        </div>
      </div>
    );
  }

  return (
    <nav className={cn("space-y-1", className)}>
      {visibleItems.map((item) => renderNavItem(item))}
    </nav>
  );
};

export default PermissionNav;

// Hook for getting user's accessible navigation items
export function usePermissionNav() {
  const { hasAnyPermission, hasAnyRole } = useAuth();

  const getAccessibleItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => {
        const hasPermissions = hasAnyPermission(item.permissions);
        const hasRoles = item.roles ? hasAnyRole(item.roles) : true;
        return hasPermissions && hasRoles;
      })
      .map((item) => ({
        ...item,
        children: item.children ? getAccessibleItems(item.children) : undefined,
      }));
  };

  const accessibleItems = getAccessibleItems(NAVIGATION_ITEMS);

  return {
    items: accessibleItems,
    hasAnyAccessibleItems: accessibleItems.length > 0,
  };
}
