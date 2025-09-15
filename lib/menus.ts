export type SubChildren = {
  href: string;
  label: string;
  active: boolean;
  children?: SubChildren[];
};
export type Submenu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus?: Submenu[];
  children?: SubChildren[];
};

export type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus: Submenu[];
  id: string;
};

export type Group = {
  groupLabel: string;
  menus: Menu[];
  id: string;
};

export function getMenuList(pathname: string, t: any): Group[] {
  return [
    {
      groupLabel: t("dashboard"),
      id: "dashboard",
      menus: [
        {
          id: "dashboard",
          href: "/",
          label: t("dashboard"),
          active: pathname.includes("/"),
          icon: "heroicons-outline:home",
          submenus: [],
        },
      ],
    },
    {
      groupLabel: t("users"),
      id: "users",
      menus: [
        {
          id: "users",
          href: "/users",
          label: t("users"),
          active: pathname.includes("/users"),
          icon: "heroicons-outline:lock-closed",
          submenus: [
            {
              href: "/users",
              label: t("users"),
              active: pathname === "/users",
              icon: "",
              children: [],
            },
            {
              href: "/users/create",
              label: t("create_user"),
              active: pathname === "/users/create",
              icon: "",
              children: [],
            },
          ],
        },
      ],
    },
    {
      groupLabel: t("roles"),
      id: "roles",
      menus: [
        {
          id: "roles",
          href: "/roles",
          label: t("roles"),
          active: pathname.includes("/roles"),
          icon: "heroicons-outline:lock-closed",
          submenus: [
            {
              href: "/roles",
              label: t("roles"),
              active: pathname === "/roles",
              icon: "",
              children: [],
            },
            {
              href: "/roles/create",
              label: t("create_user"),
              active: pathname === "/roles/create",
              icon: "",
              children: [],
            },
          ],
        },
      ],
    },
  ];
}
export function getHorizontalMenuList(pathname: string, t: any): Group[] {
  return [
    {
      groupLabel: t("dashboard"),
      id: "dashboard",
      menus: [
        {
          id: "dashboard",
          href: "/",
          label: t("dashboard"),
          active: pathname.includes("/"),
          icon: "heroicons-outline:home",
          submenus: [],
        },
      ],
    },
    {
      groupLabel: t("users"),
      id: "users",
      menus: [
        {
          id: "users",
          href: "/users",
          label: t("users"),
          active: pathname.includes("/users"),
          icon: "heroicons-outline:lock-closed",
          submenus: [
            {
              href: "/users",
              label: t("users"),
              active: pathname === "/users",
              icon: "",
              children: [],
            },
            {
              href: "/users/create",
              label: t("create_user"),
              active: pathname === "/users/create",
              icon: "",
              children: [],
            },
          ],
        },
      ],
    },
    {
      groupLabel: t("roles"),
      id: "roles",
      menus: [
        {
          id: "roles",
          href: "/roles",
          label: t("roles"),
          active: pathname.includes("/roles"),
          icon: "heroicons-outline:lock-closed",
          submenus: [
            {
              href: "/roles",
              label: t("roles"),
              active: pathname === "/roles",
              icon: "",
              children: [],
            },
            {
              href: "/roles/create",
              label: t("create_user"),
              active: pathname === "/roles/create",
              icon: "",
              children: [],
            },
          ],
        },
      ],
    },
  ];
}
