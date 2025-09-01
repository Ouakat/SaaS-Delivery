import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ParcelStatus } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hexToRGB = (hex: any, alpha?: number): any => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getStatusColor(status: ParcelStatus) {
  const colors = {
    new: "bg-gray-100 text-gray-800",
    pickup_scheduled: "bg-blue-100 text-blue-800",
    picked_up: "bg-yellow-100 text-yellow-800",
    in_transit: "bg-purple-100 text-purple-800",
    out_for_delivery: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    failed_delivery: "bg-red-100 text-red-800",
    returned: "bg-gray-100 text-gray-800",
  };
  return colors[status] || colors.new;
}

export function generateTrackingNumber(): string {
  const prefix = "SL";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function getTenantFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const tenantFromQuery = urlParams.get("tenant");

  if (tenantFromQuery) return tenantFromQuery;

  // Extract from subdomain or path
  const hostname = window.location.hostname;
  const pathSegments = window.location.pathname.split("/").filter(Boolean);

  // Check for platform in path: /platform/platform1/dashboard
  if (pathSegments[0] === "platform" && pathSegments[1]) {
    return pathSegments[1];
  }

  // Check for subdomain: platform1.speedlive.com
  if (hostname.includes(".") && !hostname.includes("localhost")) {
    const subdomain = hostname.split(".")[0];
    if (subdomain !== "www" && subdomain !== "api") {
      return subdomain;
    }
  }

  return null;
}
