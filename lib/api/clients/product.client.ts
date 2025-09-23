import { BaseApiClient, PaginatedResponse } from "@/lib/api/base.client";
import {
  Product,
  ProductVariant,
  ProductListParams,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/lib/types/product.types";

export class ProductApiClient extends BaseApiClient {
  constructor() {
    super("products"); // Using 'products' service from API_CONFIG
  }

  // Products API
  async getProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
    return this.getPaginated<Product>("/api/products", params);
  }

  async getProduct(id: string, params?: { includeVariants?: boolean; includeStocks?: boolean }): Promise<Product> {
    const response = await this.get<Product>(`/api/products/${id}`, { params });
    return response.data!;
  }

  async getProductsWithVariants(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
    return this.getPaginated<Product>("/api/products/with-variants", params);
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await this.post<Product>("/api/products", data);
    return response.data!;
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    const response = await this.patch<Product>(`/api/products/${id}`, data);
    return response.data!;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.delete(`/api/products/${id}`);
  }

  // Product Variants API
  async getProductVariants(params?: {
    skip?: number;
    take?: number;
    includeProduct?: boolean;
    includeStocks?: boolean;
    productId?: string;
    includeRelations?: boolean;
  }): Promise<PaginatedResponse<ProductVariant>> {
    return this.getPaginated<ProductVariant>("/api/product-variants", params);
  }

  async getProductVariant(id: string, params?: { includeProduct?: boolean; includeStocks?: boolean }): Promise<ProductVariant> {
    const response = await this.get<ProductVariant>(`/api/product-variants/${id}`, { params });
    return response.data!;
  }

  async getVariantsByProduct(productId: string, params?: {
    skip?: number;
    take?: number;
    includeStocks?: boolean;
  }): Promise<PaginatedResponse<ProductVariant>> {
    return this.getPaginated<ProductVariant>(`/api/product-variants/by-product/${productId}`, params);
  }

  async getVariantBySku(sku: string, params?: { includeProduct?: boolean; includeStocks?: boolean }): Promise<ProductVariant> {
    const response = await this.get<ProductVariant>(`/api/product-variants/by-sku/${sku}`, { params });
    return response.data!;
  }

  async createProductVariant(data: {
    productId: string;
    sku: string;
    name: string;
    additionalPrice: number;
    attributes: Record<string, any>;
    imageUrl?: string;
  }): Promise<ProductVariant> {
    const response = await this.post<ProductVariant>("/api/product-variants", data);
    return response.data!;
  }

  async updateProductVariant(id: string, data: {
    sku?: string;
    name?: string;
    additionalPrice?: number;
    attributes?: Record<string, any>;
    imageUrl?: string;
  }): Promise<ProductVariant> {
    const response = await this.patch<ProductVariant>(`/api/product-variants/${id}`, data);
    return response.data!;
  }

  async deleteProductVariant(id: string): Promise<void> {
    await this.delete(`/api/product-variants/${id}`);
  }

  async searchVariantsByAttributes(attributes: Record<string, any>, params?: {
    skip?: number;
    take?: number;
    includeProduct?: boolean;
    includeStocks?: boolean;
  }): Promise<PaginatedResponse<ProductVariant>> {
    return this.getPaginated<ProductVariant>("/api/product-variants/search-by-attributes", {
      ...params,
      attributes,
    });
  }

  // Utility methods for product management
  async searchProducts(query: string, params?: Omit<ProductListParams, 'search'>): Promise<PaginatedResponse<Product>> {
    return this.getProducts({ ...params, search: query });
  }

  async getProductStock(productId: string): Promise<any> {
    const response = await this.get(`/api/stocks/by-product/${productId}`);
    return response.data;
  }

  async getVariantStock(variantId: string): Promise<any> {
    const response = await this.get(`/api/stocks/by-variant/${variantId}`);
    return response.data;
  }
}

// Create singleton instance
export const productApi = new ProductApiClient();
