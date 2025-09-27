"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { expeditionClient } from "@/lib/api/clients/expedition.client";
import { AvailableProduct } from "@/lib/types/expedition.types";
import { warehouseApi } from "@/lib/api/clients/warehouse.client";
import { productApi } from "@/lib/api/clients/product.client";

interface ExpeditionItem {
  productId: string;
  variantId?: string;
  quantity_sent: number;
  productName?: string;
  variantName?: string;
}

interface ExpeditionItemsFormProps {
  initialItems: ExpeditionItem[];
  warehouseId?: string;
  sellerId?: string;
  onSubmit: (items: ExpeditionItem[]) => void;
  onBack: () => void;
}

export function ExpeditionItemsForm({
  initialItems,
  warehouseId,
  onSubmit,
  sellerId,
  onBack,
}: ExpeditionItemsFormProps) {
  const [items, setItems] = useState<ExpeditionItem[]>(initialItems);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (warehouseId) {
      loadAvailableProducts();
    }
  }, [warehouseId]);

  const loadAvailableProducts = async () => {
    if (!warehouseId) return;

    try {
      setLoading(true);
     
        const response = await productApi.getProducts({
          includeVariants: true,
              includeStocks: true,
              where: {
                userId: sellerId,
              },
              search: searchQuery || undefined,
        });
            
      console.log("_________",response.data);
      //@ts-ignore
      if(response.data[0]){
      //@ts-ignore
      setAvailableProducts(response.data[0].data);
      } else {
        setAvailableProducts([]);
      }
    } catch (error: any) {
      toast.error("Failed to load available products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    if (selectedProduct.variantId && !selectedVariant) {
      toast.error("Please select a variant");
      return;
    }

    const newItem: ExpeditionItem = {
      productId: selectedProduct.id,
      variantId: selectedVariant || undefined,
      quantity_sent: quantity,
      productName: selectedProduct.name,
      variantName: selectedProduct.variants.find((v: any) => v.id === selectedVariant)?.name || "",
    };

    // Check if item already exists
    const existingIndex = items.findIndex(
      item => item.productId === newItem.productId && item.variantId === newItem.variantId
    );

    if (existingIndex >= 0) {
      // Update quantity for existing item
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity_sent += quantity;
      setItems(updatedItems);
      toast.success("Item quantity updated");
    } else {
      // Add new item
      setItems([...items, newItem]);
      toast.success("Item added to expedition");
    }

    // Reset form
    setSelectedProduct(null);
    setSelectedVariant("");
    setQuantity(1);
    setIsAddDialogOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    toast.success("Item removed");
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedItems = [...items];
    updatedItems[index].quantity_sent = newQuantity;
    setItems(updatedItems);
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    onSubmit(items);
  };

  const getTotalQuantity = () => {
    return items.reduce((sum, item) => sum + item.quantity_sent, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Expedition Items</h3>
          <p className="text-sm text-muted-foreground">
            Add products to this expedition
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Item to Expedition</DialogTitle>
              <DialogDescription>
                Search and select a product to add to the expedition
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Products</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="Search by name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadAvailableProducts}
                    disabled={loading || !warehouseId}
                  >
                    <Icon icon="heroicons:magnifying-glass" className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!warehouseId && (
                <div className="text-center py-4 text-muted-foreground">
                  Please select a warehouse first
                </div>
              )}
              {warehouseId && availableProducts.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={selectedProduct?.id}
                    onValueChange={(value) => {
                      const product = availableProducts.find(p => p.id === value);
                      setSelectedProduct(product || null);
                      setSelectedVariant("");
                    }}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{product.name}</span> 
                            {product.basePrice !== undefined && (
                              <span className="text-xs text-muted-foreground ml-2">
                                Price: {product.basePrice}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedProduct?.hasVariants && selectedProduct.variants.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="variant">Variant</Label>
                  <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                    <SelectTrigger id="variant">
                      <SelectValue placeholder="Select a variant" />
                    </SelectTrigger>
                    <SelectContent>
                      { selectedProduct.variants.map((variant :any) => 
                        <SelectItem key={variant.id} value={variant.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{variant.name}</span>
                            {variant.sku && (
                              <span className="text-xs text-muted-foreground ml-2">
                                SKU: {variant.sku}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                      }
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProduct || (selectedProduct.variantId && !selectedVariant)}
                >
                  Add Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Icon icon="heroicons:cube" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No items added yet</p>
          <Button
            variant="outline"
            onClick={() => setIsAddDialogOpen(true)}
            disabled={!warehouseId}
          >
            <Icon icon="heroicons:plus" className="h-4 w-4 mr-2" />
            Add First Item
          </Button>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.productName || item.productId}
                  </TableCell>
                  <TableCell>
                    {item.variantName || item.variantId || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity_sent}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                      className="w-20 text-right ml-auto"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Icon icon="heroicons:trash" className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Total Items: {items.length}</span>
            <span className="text-sm font-medium">Total Quantity: {getTotalQuantity()}</span>
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <Icon icon="heroicons:arrow-left" className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={items.length === 0}>
          Next
          <Icon icon="heroicons:arrow-right" className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}