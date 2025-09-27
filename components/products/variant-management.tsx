"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { ProductVariant, Product } from "@/lib/types/product.types";
import { productApi } from "@/lib/api/clients/product.client";
import { formatPrice } from "@/lib/utils/product.utils";

const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Variant name is required"),
  additionalPrice: z.number().min(0, "Additional price cannot be negative"),
  attributes: z.record(z.string()).default({}),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

type VariantFormData = z.infer<typeof variantSchema>;

interface VariantManagementProps {
  product: Product;
  onVariantUpdate?: () => void;
}

export function VariantManagement({ product, onVariantUpdate }: VariantManagementProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [attributeKey, setAttributeKey] = useState("");
  const [attributeValue, setAttributeValue] = useState("");
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  const form = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      sku: "",
      name: "",
      additionalPrice: 0,
      attributes: {},
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (editingVariant) {
      form.reset({
        sku: editingVariant.sku,
        name: editingVariant.name,
        additionalPrice: editingVariant.additionalPrice,
        attributes: editingVariant.attributes,
        imageUrl: editingVariant.imageUrl || "",
      });
      setAttributes(editingVariant.attributes);
    } else {
      form.reset({
        sku: "",
        name: "",
        additionalPrice: 0,
        attributes: {},
        imageUrl: "",
      });
      setAttributes({});
    }
  }, [editingVariant, form]);

  const loadVariants = async () => {
    try {
      setLoading(true);
      const response = await productApi.getVariantsByProduct(product.id);
      setVariants(response.data);
    } catch (error: any) {
      toast.error("Failed to load variants");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttribute = () => {
    if (attributeKey && attributeValue) {
      const newAttributes = { ...attributes, [attributeKey]: attributeValue };
      setAttributes(newAttributes);
      form.setValue("attributes", newAttributes);
      setAttributeKey("");
      setAttributeValue("");
    }
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...attributes };
    delete newAttributes[key];
    setAttributes(newAttributes);
    form.setValue("attributes", newAttributes);
  };

  const onSubmit = async (data: VariantFormData) => {
    try {
      setLoading(true);
      
      const payload = {
        productId: product.id,
        sku: data.sku,
        tenantId :'cmfwp2d6l00007zn84qkndepd',
        name: data.name,
        attributes: data.attributes,
        imageUrl: data.imageUrl || undefined,
      };

      if (editingVariant) {
        await productApi.updateProductVariant(editingVariant.id, payload);
        toast.success("Variant updated successfully");
      } else {
        await productApi.createProductVariant(payload);
        toast.success("Variant created successfully");
      }

      await loadVariants();
      setDialogOpen(false);
      setEditingVariant(null);
      onVariantUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save variant");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariant = async (variant: ProductVariant) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;

    try {
      await productApi.deleteProductVariant(variant.id);
      toast.success("Variant deleted successfully");
      await loadVariants();
      onVariantUpdate?.();
    } catch (error: any) {
      toast.error("Failed to delete variant");
    }
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setDialogOpen(true);
  };

  const handleCreateVariant = () => {
    setEditingVariant(null);
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Variants</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateVariant}>
                <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingVariant ? "Edit Variant" : "Create Variant"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter SKU" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter variant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="additionalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Attributes Section */}
                  <div className="space-y-3">
                    <Label>Attributes</Label>
                    
                    {/* Add Attribute */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Attribute name (e.g., Color)"
                        value={attributeKey}
                        onChange={(e) => setAttributeKey(e.target.value)}
                      />
                      <Input
                        placeholder="Value (e.g., Red)"
                        value={attributeValue}
                        onChange={(e) => setAttributeValue(e.target.value)}
                      />
                      <Button type="button" onClick={handleAddAttribute}>
                        <Icon icon="heroicons:plus" className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Current Attributes */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(attributes).map(([key, value]) => (
                        <Badge key={key} className="flex items-center gap-1">
                          {key}: {value}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttribute(key)}
                            className="ml-1 hover:text-destructive"
                          >
                            <Icon icon="heroicons:x-mark" className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Icon icon="heroicons:arrow-path" className="h-4 w-4 mr-2 animate-spin" />}
                      {editingVariant ? "Update" : "Create"} Variant
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {variants.length === 0 ? (
          <div className="text-center py-8">
            <Icon icon="heroicons:cube-transparent" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No variants found</p>
            <Button onClick={handleCreateVariant}>
              <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
              Create First Variant
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Additional Price</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                  <TableCell>{variant.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(variant.attributes).map(([key, value]) => (
                        <Badge key={key} className="text-xs">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {variant.additionalPrice > 0 ? '+' : ''}
                    {formatPrice(variant.additionalPrice)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatPrice((Number(product.basePrice) + Number(variant.additionalPrice)))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditVariant(variant)}
                      >
                        <Icon icon="heroicons:pencil" className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteVariant(variant)}
                      >
                        <Icon icon="heroicons:trash" className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
