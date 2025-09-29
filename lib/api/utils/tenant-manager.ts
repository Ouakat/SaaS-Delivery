import { getTenantFromUrl } from "@/lib/utils/tenant.utils";
import { authApiClient } from "../clients/auth/auth.client";
import { usersApiClient } from "../clients/auth/users.client";
import { rolesApiClient } from "../clients/auth/roles.client";
import { tenantsApiClient } from "../clients/auth/tenants.client";
import { settingsApiClient } from "../clients/settings/settings.client";
import { emailSettingsApiClient } from "../clients/settings/email-settings.client";
import { smsSettingsApiClient } from "../clients/settings/sms-settings.client";
import { optionsApiClient } from "../clients/settings/options.client";
import { parcelsApiClient } from "../clients/parcels/parcels.client";
import { citiesApiClient } from "../clients/parcels/cities.client";
import { pickupCitiesApiClient } from "../clients/parcels/pickup-cities.client";
import { tariffsApiClient } from "../clients/parcels/tariffs.client";
import { zonesApiClient } from "../clients/parcels/zones.client";
import { deliverySlipsApiClient } from "../clients/parcels/delivery-slips.client";
import { parcelStatusesApiClient } from "../clients/parcels/parcel-statuses";
import { productApi } from "../clients/product.client";
import { stockApi } from "../clients/stock.client";
import { warehouseApi } from "../clients/warehouse.client";

// List of all API client instances
const apiClients = [
  authApiClient,
  usersApiClient,
  rolesApiClient,
  tenantsApiClient,
  settingsApiClient,
  emailSettingsApiClient,
  smsSettingsApiClient,
  optionsApiClient,
  parcelsApiClient,
  citiesApiClient,
  pickupCitiesApiClient,
  tariffsApiClient,
  zonesApiClient,
  deliverySlipsApiClient,
  parcelStatusesApiClient,
  productApi,
  stockApi,
  warehouseApi,
];

/**
 * Sets the tenant ID for all API clients
 * This ensures all API calls include the correct X-Tenant-ID header
 */
export function setTenantForAllClients(tenantId?: string | null) {
  const tenant = tenantId || getTenantFromUrl();

  if (!tenant) {
    console.warn("No tenant ID found to set for API clients");
    return;
  }

  console.log("Setting tenant ID for all API clients:", tenant);

  apiClients.forEach(client => {
    if (client && typeof client.setTenant === 'function') {
      client.setTenant(tenant);
    }
  });
}

/**
 * Clears the tenant ID from all API clients
 */
export function clearTenantForAllClients() {
  console.log("Clearing tenant ID from all API clients");

  apiClients.forEach(client => {
    if (client && typeof client.clearTenant === 'function') {
      client.clearTenant();
    }
  });
}

/**
 * Initializes all API clients with the current tenant ID
 * Should be called on app initialization and after login
 */
export function initializeApiClients() {
  const tenantId = getTenantFromUrl();
  if (tenantId) {
    setTenantForAllClients(tenantId);
  }
}
