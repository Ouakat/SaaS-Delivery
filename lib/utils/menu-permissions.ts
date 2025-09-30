import { useAuthStore } from "@/lib/stores/auth/auth.store";
import type { Group, Menu, Submenu } from "@/lib/constants/menus";

export interface MenuPermissionChecker {
  hasPermissions: (permissions?: string[]) => boolean;
  hasUserType: (userTypes?: string[]) => boolean;
  canAccessMenuItem: (item: any) => boolean;
  canAccessMenuGroup: (group: any) => boolean;
  filterMenuList: (menuList: Group[]) => Group[];
  isAuthenticated: boolean;
  user: any;
}

export function useMenuPermissions(): MenuPermissionChecker {
  const { hasPermission, hasAnyPermission, user, isAuthenticated } =
    useAuthStore();

  /**
   * Check if user has any of the required permissions
   * @param permissions Array of permission strings
   * @returns true if user has at least one permission or no permissions required
   */
  const hasPermissions = (permissions?: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    if (!isAuthenticated || !user) return false;
    return hasAnyPermission(permissions);
  };

  /**
   * Check if user has any of the required user types
   * @param userTypes Array of user type strings
   * @returns true if user has matching user type or no user types required
   */
  const hasUserType = (userTypes?: string[]): boolean => {
    if (!userTypes || userTypes.length === 0) return true;
    if (!isAuthenticated || !user?.userType) return false;
    return userTypes.includes(user.userType);
  };

  /**
   * Check if user can access a specific menu item (menu, submenu, or children)
   * @param item Menu item with potential permission/userType requirements
   * @returns true if user meets all requirements
   */
  const canAccessMenuItem = (item: any): boolean => {
    if (!isAuthenticated || !user) return false;

    const hasRequiredPermissions = hasPermissions(item.requiredPermissions);
    const hasRequiredUserType = hasUserType(item.requiredUserTypes);

    return hasRequiredPermissions && hasRequiredUserType;
  };

  /**
   * Check if user can access a menu group
   * @param group Menu group with potential permission/userType requirements
   * @returns true if group is accessible and has at least one accessible menu
   */
  const canAccessMenuGroup = (group: Group): boolean => {
    if (!isAuthenticated || !user) return false;

    // Check if group itself has permission requirements
    const groupHasAccess = canAccessMenuItem(group);
    if (!groupHasAccess) return false;

    // Check if at least one menu item in the group is accessible
    const hasAccessibleMenus = group.menus?.some((menu: Menu) => {
      const menuHasAccess = canAccessMenuItem(menu);
      if (!menuHasAccess) return false;

      // For menus with submenus, check if at least one submenu is accessible
      if (menu.submenus && menu.submenus.length > 0) {
        return menu.submenus.some((submenu: Submenu) =>
          canAccessMenuItem(submenu)
        );
      }

      return true;
    });

    return hasAccessibleMenus;
  };

  /**
   * Filter entire menu list based on user permissions
   * @param menuList Complete menu list from getMenuList()
   * @returns Filtered menu list with only accessible items
   */
  const filterMenuList = (menuList: Group[]): Group[] => {
    if (!isAuthenticated || !user) return [];
    console.log(user);
    console.log(menuList);
    
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
    isAuthenticated,
    user,
  };
}

/**
 * Utility function to check menu permissions without hook (for server-side or non-component usage)
 * @param menuList Menu list to filter
 * @param user User object with permissions and userType
 * @param hasAnyPermissionFn Function to check permissions
 * @returns Filtered menu list
 */
export function filterMenuListWithUser(
  menuList: Group[],
  user: any,
  hasAnyPermissionFn: (permissions: string[]) => boolean
): Group[] {
  if (!user) return [];

  const hasPermissions = (permissions?: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    return hasAnyPermissionFn(permissions);
  };

  const hasUserType = (userTypes?: string[]): boolean => {
    if (!userTypes || userTypes.length === 0) return true;
    if (!user.userType) return false;
    return userTypes.includes(user.userType);
  };

  const canAccessMenuItem = (item: any): boolean => {
    const hasRequiredPermissions = hasPermissions(item.requiredPermissions);
    const hasRequiredUserType = hasUserType(item.requiredUserTypes);
    return hasRequiredPermissions && hasRequiredUserType;
  };

  const canAccessMenuGroup = (group: Group): boolean => {
    const groupHasAccess = canAccessMenuItem(group);
    if (!groupHasAccess) return false;

    const hasAccessibleMenus = group.menus?.some((menu: Menu) => {
      const menuHasAccess = canAccessMenuItem(menu);
      if (!menuHasAccess) return false;

      if (menu.submenus && menu.submenus.length > 0) {
        return menu.submenus.some((submenu: Submenu) =>
          canAccessMenuItem(submenu)
        );
      }

      return true;
    });

    return hasAccessibleMenus;
  };

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
          if (menu.submenus && menu.submenus.length > 0) {
            return menu.submenus.length > 0;
          }
          return true;
        }),
    }))
    .filter((group) => group.menus.length > 0);
}

/**
 * Debug helper to log menu filtering results
 * @param originalMenus Original menu list
 * @param filteredMenus Filtered menu list
 * @param user Current user
 */
export function debugMenuPermissions(
  originalMenus: Group[],
  filteredMenus: Group[],
  user: any
): void {
  if (process.env.NODE_ENV !== "development") return;

  console.group("🔍 Menu Permissions Debug");
  console.log("User:", {
    userType: user?.userType,
    permissions: user?.permissions?.length || 0,
  });

  console.log("Original groups:", originalMenus.length);
  console.log("Filtered groups:", filteredMenus.length);

  originalMenus.forEach((group) => {
    const filteredGroup = filteredMenus.find((g) => g.id === group.id);
    const originalMenuCount = group.menus.length;
    const filteredMenuCount = filteredGroup?.menus.length || 0;

    console.log(
      `📁 ${group.groupLabel}: ${filteredMenuCount}/${originalMenuCount} menus accessible`
    );

    if (filteredGroup) {
      filteredGroup.menus.forEach((menu) => {
        const submenuCount = menu.submenus.length;
        console.log(
          `  📄 ${menu.label}${
            submenuCount > 0 ? ` (${submenuCount} submenus)` : ""
          }`
        );
      });
    }
  });

  console.groupEnd();
}

/**
 * Get user's accessible menu paths (useful for navigation guards)
 * @param menuList Filtered menu list
 * @returns Array of accessible paths
 */
export function getAccessiblePaths(menuList: Group[]): string[] {
  const paths: string[] = [];

  menuList.forEach((group) => {
    group.menus.forEach((menu) => {
      if (menu.href) paths.push(menu.href);

      menu.submenus.forEach((submenu) => {
        if (submenu.href) paths.push(submenu.href);

        submenu.children?.forEach((child) => {
          if (child.href) paths.push(child.href);
        });
      });
    });
  });

  return Array.from(new Set(paths));
}
