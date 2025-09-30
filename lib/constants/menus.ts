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
      groupLabel: t("stocks"),
      id: "products",
      requiredPermissions: ["products:read"],
      menus: [
        {
          id: "products",
          href: "/products",
          label: t("products"),
          active: pathname.includes("/products"),
          icon: "heroicons-outline:cube",
          requiredPermissions: ["products:read"],
          submenus: [
            {
              href: "/products",
              label: t("products"),
              active: pathname === "/products",
              icon: "",
              children: [],
              requiredPermissions: ["products:read"],
            },
            {
              href: "/products/create",
              label: t("create_product"),
              active: pathname === "/products/create",
              icon: "",
              children: [],
              requiredPermissions: ["products:create"],
            },
          ],
        },
        {
          id: "warehouses",
          href: "/warehouses",
          label: t("warehouses"),
          active: pathname.includes("/warehouses"),
          icon: "heroicons-outline:building-storefront",
          requiredPermissions: ["warehouses:read"],
          submenus: [
            {
              href: "/warehouses",
              label: t("warehouses"),
              active: pathname === "/warehouses",
              icon: "",
              children: [],
              requiredPermissions: ["warehouses:read"],
            },
            {
              href: "/warehouses/create",
              label: t("create_warehouse"),
              active: pathname === "/warehouses/create",
              icon: "",
              children: [],
              requiredPermissions: ["warehouses:create"],
            },
          ],
        },
        {
          id: "expeditions",
          href: "/expeditions",
          label: t("expeditions"),
          active: pathname.includes("/expeditions"),
          icon: "heroicons-outline:truck",
          requiredPermissions: ["expeditions:read"],
          submenus: [
            {
              href: "/expeditions",
              label: t("expeditions_list"),
              active: pathname === "/expeditions",
              icon: "",
              children: [],
              requiredPermissions: ["expeditions:read"],
            },
            {
              href: "/expeditions/new",
              label: t("new_expedition"),
              active: pathname === "/expeditions/new",
              icon: "",
              children: [],
              requiredPermissions: ["expeditions:create"],
            },
          ],
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
      groupLabel: t("stocks"),
      id: "products",
      requiredPermissions: ["warehouse:read"],
      menus: [
        {
          id: "products",
          href: "/products",
          label: t("products"),
          active: pathname.includes("/products"),
          icon: "heroicons-outline:cube",
          requiredPermissions: ["warehouse:read"],
          submenus: [
            {
              href: "/products",
              label: t("products"),
              active: pathname === "/products",
              icon: "",
              children: [],
              requiredPermissions: ["warehouse:read"],
            },
            {
              href: "/products/create",
              label: t("create_product"),
              active: pathname === "/products/create",
              icon: "",
              children: [],
              requiredPermissions: ["warehouse:create"],
            },
          ],
        },
        {
          id: "warehouses",
          href: "/warehouses",
          label: t("warehouses"),
          active: pathname.includes("/warehouses"),
          icon: "heroicons-outline:building-storefront",
          requiredPermissions: ["warehouse:read"],
          submenus: [
            {
              href: "/warehouses",
              label: t("warehouses"),
              active: pathname === "/warehouses",
              icon: "",
              children: [],
              requiredPermissions: ["warehouse:read"],
            },
            {
              href: "/warehouses/create",
              label: t("create_warehouse"),
              active: pathname === "/warehouses/create",
              icon: "",
              children: [],
              requiredPermissions: ["warehouse:create"],
            },
          ],
        },
      ],
    },
    {
      groupLabel: t("logistics_management"),
      id: "logistics",
      requiredPermissions: ["parcels:read"],
      menus: [
        {
          id: "parcels",
          href: "/parcels",
          label: t("parcels"),
          active: pathname.includes("/parcels"),
          icon: "heroicons-outline:cube",
          requiredPermissions: ["parcels:read"],
          submenus: [
            {
              href: "/parcels",
              label: t("parcels_list"),
              active: pathname === "/parcels",
              icon: "",
              children: [],
              requiredPermissions: ["parcels:read"],
            },
            {
              href: "/parcels/create",
              label: t("create_parcel"),
              active: pathname === "/parcels/create",
              icon: "",
              children: [],
              requiredPermissions: ["parcels:create"],
            },
            {
              href: "/parcels/my-parcels",
              label: t("my_parcels"),
              active: pathname === "/parcels/my-parcels",
              icon: "",
              children: [],
              requiredPermissions: ["parcels:read"],
              requiredUserTypes: ["SELLER"],
            },
            {
              href: "/parcels/pickup-ready",
              label: t("pickup_ready"),
              active: pathname === "/parcels/pickup-ready",
              icon: "",
              children: [],
              requiredPermissions: ["parcels:read"],
            },
            {
              href: "/parcels/statistics",
              label: t("parcels_statistics"),
              active: pathname === "/parcels/statistics",
              icon: "",
              children: [],
              requiredPermissions: ["parcels:read"],
            },
          ],
        },
        {
          id: "delivery-slips",
          href: "/delivery-slips",
          label: t("delivery_slips"),
          active: pathname.includes("/delivery-slips"),
          icon: "heroicons-outline:clipboard-list",
          requiredPermissions: ["delivery_slips:read"],
          submenus: [
            {
              href: "/delivery-slips",
              label: t("delivery_slips_list"),
              active: pathname === "/delivery-slips",
              icon: "",
              children: [],
              requiredPermissions: ["delivery_slips:read"],
            },
            {
              href: "/delivery-slips/create",
              label: t("create_delivery_slip"),
              active: pathname === "/delivery-slips/create",
              icon: "",
              children: [],
              requiredPermissions: ["delivery_slips:create"],
            },
            {
              href: "/delivery-slips/available-parcels",
              label: t("available_parcels"),
              active: pathname === "/delivery-slips/available-parcels",
              icon: "",
              children: [],
              requiredPermissions: ["delivery_slips:create"],
            },
            {
              href: "/delivery-slips/statistics",
              label: t("delivery_statistics"),
              active: pathname === "/delivery-slips/statistics",
              icon: "",
              children: [],
              requiredPermissions: ["delivery_slips:read"],
            },
          ],
        },
        {
          id: "distribution-slips",
          href: "/distribution-slips",
          label: t("distribution_slips"),
          active: pathname.includes("/distribution-slips"),
          icon: "heroicons-outline:truck",
          requiredPermissions: ["distribution_slips:read"],
          submenus: [
            {
              href: "/distribution-slips",
              label: t("distribution_slips_list"),
              active: pathname === "/distribution-slips",
              icon: "",
              children: [],
              requiredPermissions: ["distribution_slips:read"],
            },
            {
              href: "/distribution-slips/create",
              label: t("create_distribution_slip"),
              active: pathname === "/distribution-slips/create",
              icon: "",
              children: [],
              requiredPermissions: ["distribution_slips:create"],
            },
            {
              href: "/distribution-slips/available-parcels",
              label: t("available_parcels"),
              active: pathname === "/distribution-slips/available-parcels",
              icon: "",
              children: [],
              requiredPermissions: ["distribution_slips:read"],
            },
            {
              href: "/distribution-slips/delivery-personnel",
              label: t("delivery_personnel"),
              active: pathname === "/distribution-slips/delivery-personnel",
              icon: "",
              children: [],
              requiredPermissions: ["distribution_slips:read"],
            },
            {
              href: "/distribution-slips/statistics",
              label: t("distribution_statistics"),
              active: pathname === "/distribution-slips/statistics",
              icon: "",
              children: [],
              requiredPermissions: ["distribution_slips:read"],
            },
          ],
        },
        {
          id: "shipping-slips",
          href: "/shipping-slips",
          label: t("shipping_slips"),
          active: pathname.includes("/shipping-slips"),
          icon: "heroicons-outline:paper-airplane",
          requiredPermissions: ["shipping_slips:read"],
          submenus: [
            {
              href: "/shipping-slips",
              label: t("shipping_slips_list"),
              active: pathname === "/shipping-slips",
              icon: "",
              children: [],
              requiredPermissions: ["shipping_slips:read"],
            },
            {
              href: "/shipping-slips/create",
              label: t("create_shipping_slip"),
              active: pathname === "/shipping-slips/create",
              icon: "",
              children: [],
              requiredPermissions: ["shipping_slips:create"],
            },
            {
              href: "/shipping-slips/available-parcels",
              label: t("available_parcels"),
              active: pathname === "/shipping-slips/available-parcels",
              icon: "",
              children: [],
              requiredPermissions: ["shipping_slips:read"],
            },
            {
              href: "/shipping-slips/statistics",
              label: t("shipping_statistics"),
              active: pathname === "/shipping-slips/statistics",
              icon: "",
              children: [],
              requiredPermissions: ["shipping_slips:read"],
            },
          ],
        },
        {
          id: "return-slips",
          href: "/return-slips",
          label: t("return_slips"),
          active: pathname.includes("/return-slips"),
          icon: "heroicons-outline:arrow-uturn-left",
          requiredPermissions: ["return_slips:read"],
          submenus: [
            {
              href: "/return-slips",
              label: t("return_slips_list"),
              active: pathname === "/return-slips",
              icon: "",
              children: [],
              requiredPermissions: ["return_slips:read"],
            },
            {
              href: "/return-slips/create",
              label: t("create_return_slip"),
              active: pathname === "/return-slips/create",
              icon: "",
              children: [],
              requiredPermissions: ["return_slips:create"],
            },
            {
              href: "/return-slips/available-parcels",
              label: t("available_parcels"),
              active: pathname === "/return-slips/available-parcels",
              icon: "",
              children: [],
              requiredPermissions: ["return_slips:read"],
            },
            {
              href: "/return-slips/return-reasons",
              label: t("return_reasons_stats"),
              active: pathname === "/return-slips/return-reasons",
              icon: "",
              children: [],
              requiredPermissions: ["return_slips:read"],
            },
            {
              href: "/return-slips/statistics",
              label: t("return_statistics"),
              active: pathname === "/return-slips/statistics",
              icon: "",
              children: [],
              requiredPermissions: ["return_slips:read"],
            },
          ],
        },
        {
          id: "payment-slips",
          href: "/payment-slips",
          label: t("payment_slips"),
          active: pathname.includes("/payment-slips"),
          icon: "heroicons-outline:credit-card",
          requiredPermissions: ["payment_slips:read"],
          submenus: [
            {
              href: "/payment-slips",
              label: t("payment_slips_list"),
              active: pathname === "/payment-slips",
              icon: "",
              children: [],
              requiredPermissions: ["payment_slips:read"],
            },
            {
              href: "/payment-slips/create",
              label: t("create_payment_slip"),
              active: pathname === "/payment-slips/create",
              icon: "",
              children: [],
              requiredPermissions: ["payment_slips:create"],
            },
            {
              href: "/payment-slips/available-parcels",
              label: t("available_parcels"),
              active: pathname === "/payment-slips/available-parcels",
              icon: "",
              children: [],
              requiredPermissions: ["payment_slips:read"],
            },
            {
              href: "/payment-slips/statistics",
              label: t("payment_statistics"),
              active: pathname === "/payment-slips/statistics",
              icon: "",
              children: [],
              requiredPermissions: ["payment_slips:read"],
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
                  requiredPermissions: ["pickup_cities:read"],
                },
                {
                  href: "/settings/pickup-cities/create",
                  label: t("create_pickup_city"),
                  active: pathname === "/settings/pickup-cities/create",
                  requiredPermissions: ["pickup_cities:create"],
                },
              ],
              requiredPermissions: ["pickup_cities:read"],
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
                  requiredPermissions: ["sms_settings:read"],
                },
                {
                  href: "/settings/sms/templates",
                  label: t("sms_templates"),
                  active: pathname === "/settings/sms/templates",
                  requiredPermissions: ["sms_settings:read"],
                },
              ],
              requiredPermissions: ["sms_settings:read"],
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
                  requiredPermissions: ["email_settings:read"],
                },
                {
                  href: "/settings/email/templates",
                  label: t("email_templates"),
                  active: pathname === "/settings/email/templates",
                  requiredPermissions: ["email_settings:read"],
                },
              ],
              requiredPermissions: ["email_settings:read"],
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
