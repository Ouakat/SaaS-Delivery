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
