"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { productApi } from "@/lib/api/clients/product.client";
import { CreateProductRequest, Product } from "@/lib/types/product.types";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Name too long"),
  description: z.string().optional(),
  basePrice: z.number().min(0, "Price must be positive"),
  hasVariants: z.boolean().default(false),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.imageUrl || null
  );

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      basePrice: product?.basePrice || 0,
      hasVariants: product?.hasVariants || false,
      imageUrl: product?.imageUrl || "",
    },
  });

  const isEditing = !!product;

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);

      const payload: CreateProductRequest = {
        name: data.name,
        description: data.description || undefined,
        basePrice: data.basePrice,
        hasVariants: data.hasVariants,
        imageUrl: data.imageUrl || undefined,
      };

      let result: Product;
      if (isEditing) {
        result = await productApi.updateProduct(product.id, payload);
        toast.success("Product updated successfully");
      } else {
        result = await productApi.createProduct(payload);
        toast.success("Product created successfully");
      }

      onSuccess?.(result);
      
      if (!onSuccess) {
        router.push("/products");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImagePreview(url || null);
    form.setValue("imageUrl", url);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit Product" : "Create Product"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing 
              ? "Update product information and settings"
              : "Add a new product to your catalog"
            }
          </p>
        </div>
        <Button variant="ghost" onClick={handleCancel}>
          <Icon icon="heroicons:x-mark" className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter product name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description (optional)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of your product
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Set the base price in USD. Additional pricing for variants can be set later.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Product Image */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleImageUrlChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a URL to your product image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Preview */}
              {imagePreview && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreview(null)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Product Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="hasVariants"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Product Variants
                      </FormLabel>
                      <FormDescription>
                        Enable if this product has variants like size, color, etc.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
