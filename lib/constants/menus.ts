export type SubChildren = {
  href: string;
  label: string;
  active: boolean;
  children?: SubChildren[];
  requiredPermissions?: string[];
  requiredUserTypes?: string[];
};

export type Submenu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus?: Submenu[];
  children?: SubChildren[];
  requiredPermissions?: string[];
  requiredUserTypes?: string[];
};

export type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus: Submenu[];
  id: string;
  requiredPermissions?: string[];
  requiredUserTypes?: string[];
};

export type Group = {
  groupLabel: string;
  menus: Menu[];
  id: string;
  requiredPermissions?: string[];
  requiredUserTypes?: string[];
};

export function getMenuList(pathname: string, t: any): Group[] {
  return [
    {
      groupLabel: t("dashboard"),
      id: "dashboard",
      requiredUserTypes: ["ADMIN", "MANAGER"],
      menus: [
        {
          id: "dashboard",
          href: "/",
          label: t("dashboard"),
          active: pathname === "/",
          icon: "heroicons-outline:home",
          requiredUserTypes: ["ADMIN", "MANAGER"],
          submenus: [],
        },
      ],
    },
    {
      groupLabel: t("users"),
      id: "users",
      requiredPermissions: ["users:read"],
      menus: [
        {
          id: "users",
          href: "/users",
          label: t("users"),
          active: pathname.includes("/users"),
          icon: "heroicons-outline:users",
          requiredPermissions: ["users:read"],
          submenus: [
            {
              href: "/users",
              label: t("users"),
              active: pathname === "/users",
              icon: "",
              children: [],
              requiredPermissions: ["users:read"],
            },
            {
              href: "/users/create",
              label: t("create_user"),
              active: pathname === "/users/create",
              icon: "",
              children: [],
              requiredPermissions: ["users:create"],
            },
          ],
        },
      ],
    },
    {
      groupLabel: t("roles"),
      id: "roles",
      requiredPermissions: ["roles:read"],
      menus: [
        {
          id: "roles",
          href: "/roles",
          label: t("roles"),
          active: pathname.includes("/roles"),
          icon: "heroicons-outline:identification",
          requiredPermissions: ["roles:read"],
          submenus: [
            {
              href: "/roles",
              label: t("roles"),
              active: pathname === "/roles",
              icon: "",
              children: [],
              requiredPermissions: ["roles:read"],
            },
            {
              href: "/roles/create",
              label: t("create_role"),
              active: pathname === "/roles/create",
              icon: "",
              children: [],
              requiredPermissions: ["roles:create"],
            },
            {
              href: "/roles/permissions",
              label: t("permissions"),
              active: pathname === "/roles/permissions",
              icon: "",
              children: [],
              requiredPermissions: ["roles:read"],
            },
          ],
        },
      ],
    },
    // Add more sections as needed
  ];
}

export function getHorizontalMenuList(pathname: string, t: any): Group[] {
  return getMenuList(pathname, t); // Use the same logic for horizontal menus
}

// lib/utils/menu-permissions.ts
import { useAuthStore } from "@/lib/stores/auth.store";

export function useMenuPermissions() {
  const { hasPermission, hasAnyPermission, user } = useAuthStore();

  const hasPermissions = (permissions?: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    return hasAnyPermission(permissions);
  };

  const hasUserType = (userTypes?: string[]): boolean => {
    if (!userTypes || userTypes.length === 0) return true;
    if (!user?.userType) return false;
    return userTypes.includes(user.userType);
  };

  const canAccessMenuItem = (item: any): boolean => {
    const hasRequiredPermissions = hasPermissions(item.requiredPermissions);
    const hasRequiredUserType = hasUserType(item.requiredUserTypes);
    return hasRequiredPermissions && hasRequiredUserType;
  };

  const canAccessMenuGroup = (group: any): boolean => {
    // Check if group has permission requirements
    const groupHasAccess = canAccessMenuItem(group);
    if (!groupHasAccess) return false;

    // Check if at least one menu item in the group is accessible
    const hasAccessibleMenus = group.menus?.some((menu: any) => {
      const menuHasAccess = canAccessMenuItem(menu);
      if (!menuHasAccess) return false;

      // For menus with submenus, check if at least one submenu is accessible
      if (menu.submenus && menu.submenus.length > 0) {
        return menu.submenus.some((submenu: any) => canAccessMenuItem(submenu));
      }

      return true;
    });

    return hasAccessibleMenus;
  };

  const filterMenuList = (menuList: Group[]): Group[] => {
    return menuList
      .filter((group) => canAccessMenuGroup(group))
      .map((group) => ({
        ...group,
        menus: group.menus
          .filter((menu) => canAccessMenuItem(menu))
          .map((menu) => ({
            ...menu,
            submenus: menu.submenus.filter((submenu) =>
              canAccessMenuItem(submenu)
            ),
          }))
          .filter((menu) => {
            // If menu has submenus, only include if at least one submenu is accessible
            if (menu.submenus && menu.submenus.length > 0) {
              return menu.submenus.length > 0;
            }
            return true;
          }),
      }))
      .filter((group) => group.menus.length > 0); // Remove empty groups
  };

  return {
    hasPermissions,
    hasUserType,
    canAccessMenuItem,
    canAccessMenuGroup,
    filterMenuList,
  };
}
