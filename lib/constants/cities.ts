export const CITY_ZONES = [
  { value: "Zone A", label: "Zone A" },
  { value: "Zone B", label: "Zone B" },
  { value: "Zone C", label: "Zone C" },
  { value: "Zone D", label: "Zone D" },
] as const;

export const CITY_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
] as const;

export const PICKUP_CITY_OPTIONS = [
  { value: "all", label: "All Cities" },
  { value: "true", label: "Pickup Cities Only" },
  { value: "false", label: "Non-Pickup Cities" },
] as const;

export const CITIES_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const CITIES_SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "ref", label: "Reference" },
  { value: "zone", label: "Zone" },
  { value: "createdAt", label: "Created Date" },
] as const;
