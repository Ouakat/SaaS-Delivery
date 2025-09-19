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
    {
      groupLabel: t("settings"),
      id: "settings",
      requiredPermissions: ["settings:read"],
      menus: [
        {
          id: "settings",
          href: "/settings",
          label: t("settings"),
          active: pathname.includes("/settings"),
          icon: "heroicons-outline:cog",
          requiredPermissions: ["settings:read"],
          submenus: [
            {
              href: "/settings",
              label: t("settings_dashboard"),
              active: pathname === "/settings",
              icon: "heroicons-outline:chart-bar",
              children: [],
              requiredPermissions: ["settings:read"],
            },
            {
              href: "/settings/general",
              label: t("general_settings"),
              active: pathname === "/settings/general",
              icon: "heroicons-outline:adjustments",
              children: [],
              requiredPermissions: ["settings:read"],
            },
            {
              href: "/settings/cities",
              label: t("cities"),
              active: pathname.includes("/settings/cities"),
              icon: "heroicons-outline:location-marker",
              children: [
                {
                  href: "/settings/cities",
                  label: t("cities_list"),
                  active: pathname === "/settings/cities",
                  requiredPermissions: ["cities:read"],
                },
                {
                  href: "/settings/cities/create",
                  label: t("create_city"),
                  active: pathname === "/settings/cities/create",
                  requiredPermissions: ["cities:create"],
                },
              ],
              requiredPermissions: ["cities:read"],
            },
            {
              href: "/settings/pickup-cities",
              label: t("pickup_cities"),
              active: pathname.includes("/settings/pickup-cities"),
              icon: "heroicons-outline:map",
              children: [
                {
                  href: "/settings/pickup-cities",
                  label: t("pickup_cities_list"),
                  active: pathname === "/settings/pickup-cities",
                  requiredPermissions: ["pickup-cities:read"],
                },
                {
                  href: "/settings/pickup-cities/create",
                  label: t("create_pickup_city"),
                  active: pathname === "/settings/pickup-cities/create",
                  requiredPermissions: ["pickup-cities:create"],
                },
              ],
              requiredPermissions: ["pickup-cities:read"],
            },
            {
              href: "/settings/tariffs",
              label: t("tariffs"),
              active: pathname.includes("/settings/tariffs"),
              icon: "heroicons-outline:currency-dollar",
              children: [
                {
                  href: "/settings/tariffs",
                  label: t("tariffs_list"),
                  active: pathname === "/settings/tariffs",
                  requiredPermissions: ["tariffs:read"],
                },
                {
                  href: "/settings/tariffs/create",
                  label: t("create_tariff"),
                  active: pathname === "/settings/tariffs/create",
                  requiredPermissions: ["tariffs:create"],
                },
                {
                  href: "/settings/tariffs/bulk-import",
                  label: t("bulk_import_tariffs"),
                  active: pathname === "/settings/tariffs/bulk-import",
                  requiredPermissions: ["tariffs:create"],
                },
              ],
              requiredPermissions: ["tariffs:read"],
            },
            {
              href: "/settings/zones",
              label: t("zones"),
              active: pathname.includes("/settings/zones"),
              icon: "heroicons-outline:globe",
              children: [
                {
                  href: "/settings/zones",
                  label: t("zones_list"),
                  active: pathname === "/settings/zones",
                  requiredPermissions: ["zones:read"],
                },
                {
                  href: "/settings/zones/create",
                  label: t("create_zone"),
                  active: pathname === "/settings/zones/create",
                  requiredPermissions: ["zones:create"],
                },
              ],
              requiredPermissions: ["zones:read"],
            },
            {
              href: "/settings/options",
              label: t("options"),
              active: pathname.includes("/settings/options"),
              icon: "heroicons-outline:menu",
              children: [
                {
                  href: "/settings/options",
                  label: t("options_overview"),
                  active: pathname === "/settings/options",
                  requiredPermissions: ["options:read"],
                },
                {
                  href: "/settings/options/parcel-statuses",
                  label: t("parcel_statuses"),
                  active: pathname === "/settings/options/parcel-statuses",
                  requiredPermissions: ["options:parcel_statuses:read"],
                },
                {
                  href: "/settings/options/client-types",
                  label: t("client_types"),
                  active: pathname === "/settings/options/client-types",
                  requiredPermissions: ["options:client_types:read"],
                },
                {
                  href: "/settings/options/banks",
                  label: t("banks"),
                  active: pathname === "/settings/options/banks",
                  requiredPermissions: ["options:banks:read"],
                },
              ],
              requiredPermissions: ["options:read"],
            },
            {
              href: "/settings/sms",
              label: t("sms_settings"),
              active: pathname.includes("/settings/sms"),
              icon: "heroicons-outline:chat",
              children: [
                {
                  href: "/settings/sms",
                  label: t("sms_configuration"),
                  active: pathname === "/settings/sms",
                  requiredPermissions: ["sms-settings:read"],
                },
                {
                  href: "/settings/sms/templates",
                  label: t("sms_templates"),
                  active: pathname === "/settings/sms/templates",
                  requiredPermissions: ["sms-settings:read"],
                },
              ],
              requiredPermissions: ["sms-settings:read"],
            },
            {
              href: "/settings/email",
              label: t("email_settings"),
              active: pathname.includes("/settings/email"),
              icon: "heroicons-outline:mail",
              children: [
                {
                  href: "/settings/email",
                  label: t("email_configuration"),
                  active: pathname === "/settings/email",
                  requiredPermissions: ["email-settings:read"],
                },
                {
                  href: "/settings/email/templates",
                  label: t("email_templates"),
                  active: pathname === "/settings/email/templates",
                  requiredPermissions: ["email-settings:read"],
                },
              ],
              requiredPermissions: ["email-settings:read"],
            },
          ],
        },
      ],
    },
  ];
}

export function getHorizontalMenuList(pathname: string, t: any): Group[] {
  return getMenuList(pathname, t); // Use the same logic for horizontal menus
}
