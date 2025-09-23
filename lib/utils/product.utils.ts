import { Product, Stock } from "@/lib/types/product.types";

export const formatPrice = (price: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
};

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStockSummary = (stocks: Stock[] = []) => {
  if (stocks.length === 0) {
    return { total: 0, reserved: 0, available: 0 };
  }

  const total = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
  const reserved = stocks.reduce((sum, stock) => sum + stock.reserved, 0);
  const available = total - reserved;

  return { total, reserved, available };
};

export const getStockStatus = (stocks: Stock[] = []) => {
  const { available } = getStockSummary(stocks);
  
  if (available <= 0) {
    return { status: "out_of_stock", label: "Out of Stock", color: "destructive" };
  } else if (available <= 10) {
    return { status: "low_stock", label: "Low Stock", color: "warning" };
  } else {
    return { status: "in_stock", label: "In Stock", color: "success" };
  }
};

export const calculateFinalPrice = (basePrice: number, additionalPrice: number = 0): number => {
  return basePrice + additionalPrice;
};

export const generateSKU = (productName: string, attributes: Record<string, any> = {}): string => {
  const cleanName = productName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  const attrString = Object.values(attributes).join('').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  const timestamp = Date.now().toString().slice(-4);
  
  return `${cleanName}-${attrString}-${timestamp}`;
};

export const filterProductsByStock = (products: Product[], stockStatus: string) => {
  return products.filter(product => {
    const status = getStockStatus(product.stocks);
    return status.status === stockStatus;
  });
};

export const sortProducts = (products: Product[], field: keyof Product, direction: 'asc' | 'desc') => {
  return [...products].sort((a, b) => {
    let aValue: any = a[field];
    let bValue: any = b[field];
    
    if (field === 'createdAt' || field === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const searchProducts = (products: Product[], query: string): Product[] => {
  if (!query.trim()) return products;
  
  const lowercaseQuery = query.toLowerCase();
  
  return products.filter(product => 
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description?.toLowerCase().includes(lowercaseQuery) ||
    product.variants?.some(variant => 
      variant.name.toLowerCase().includes(lowercaseQuery) ||
      variant.sku.toLowerCase().includes(lowercaseQuery) ||
      Object.values(variant.attributes).some(attr => 
        String(attr).toLowerCase().includes(lowercaseQuery)
      )
    )
  );
};
