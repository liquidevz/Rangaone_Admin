// components/telegram-mapping-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Plus,
  Package,
} from "lucide-react";
import {
  Product,
  TelegramGroup,
  getProducts,
  getGroups,
  getUnmappedGroups,
  mapProductToGroup,
  unmapProductFromGroup,
  getProductGroupMapping,
} from "@/lib/api-telegram-bot";

export function MappingTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [allGroups, setAllGroups] = useState<TelegramGroup[]>([]);
  const [unmappedGroups, setUnmappedGroups] = useState<TelegramGroup[]>([]);
  const [productMappings, setProductMappings] = useState<Record<string, { telegram_group_id: string; telegram_group_name: string } | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsData, groupsData, unmappedData] = await Promise.all([
        getProducts(),
        getGroups(),
        getUnmappedGroups(),
      ]);
      
      setProducts(productsData);
      setAllGroups(groupsData);
      setUnmappedGroups(unmappedData);
      
      // Load group mappings for each product
      const mappings: Record<string, { telegram_group_id: string; telegram_group_name: string } | null> = {};
      for (const product of productsData) {
        try {
          const mapping = await getProductGroupMapping(String(product.id));
          mappings[String(product.id)] = mapping;
        } catch (error) {
          mappings[String(product.id)] = null;
        }
      }
      setProductMappings(mappings);
    } catch (error) {
      console.error("Failed to load mapping data:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to load mapping data: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMapProduct = async () => {
    if (!selectedProduct || !selectedGroup) {
      toast({
        title: "Error",
        description: "Please select both a product and a group",
        variant: "destructive",
      });
      return;
    }

    const selectedGroupData = unmappedGroups.find(g => g.telegram_group_id === selectedGroup);
    
    if (!selectedGroupData) {
      toast({
        title: "Error",
        description: "Selected group not found",
        variant: "destructive",
      });
      return;
    }

    try {
      await mapProductToGroup(selectedProduct, {
        telegram_group_id: selectedGroupData.telegram_group_id,
        telegram_group_name: selectedGroupData.telegram_group_name
      });
      
      toast({
        title: "Success",
        description: "Product mapped to group successfully",
      });
      setIsMapDialogOpen(false);
      setSelectedProduct("");
      setSelectedGroup("");
      loadData();
    } catch (error) {
      console.error('Mapping error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to map product to group: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleUnmapProduct = async (productId: string | number) => {
    if (!confirm('Are you sure you want to unmap this product from its group?')) return;

    try {
      await unmapProductFromGroup(String(productId));
      toast({
        title: "Success",
        description: "Product unmapped from group successfully",
      });
      loadData();
    } catch (error) {
      console.error('Unmapping error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to unmap product from group: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const mappedProducts = products.filter(p => productMappings[String(p.id)]);
  const unmappedProducts = products.filter(p => !productMappings[String(p.id)]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading mapping data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Available products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapped Products</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mappedProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Connected to groups
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmapped Products</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unmappedProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Need group connections
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Groups</CardTitle>
            <LinkIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unmappedGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for mapping
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={unmappedProducts.length === 0 || unmappedGroups.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Map Product to Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Map Product to Group</DialogTitle>
              <DialogDescription>
                Connect a product to a Telegram group
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Product</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {unmappedProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Select Group</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {unmappedGroups.map((group) => {
                      console.log('Available group:', group);
                      return (
                        <SelectItem key={group.id} value={group.telegram_group_id}>
                          {group.telegram_group_name} ({group.telegram_group_id})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsMapDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMapProduct}>Map</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Current Mappings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Current Product-Group Mappings
          </CardTitle>
          <CardDescription>
            Active connections between products and Telegram groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>

                <TableHead>Group</TableHead>
                <TableHead>Mapped Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No product-group mappings found
                  </TableCell>
                </TableRow>
              ) : (
                mappedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.description}</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {productMappings[String(product.id)] ? (
                          <div>
                            <div className="font-medium">{productMappings[String(product.id)]?.telegram_group_name}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {productMappings[String(product.id)]?.telegram_group_id}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : ''}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnmapProduct(product.id)}
                        >
                          <Unlink className="h-3 w-3 mr-1" />
                          Unmap
                        </Button>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unmapped Products */}
      {unmappedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Unmapped Products ({unmappedProducts.length})
            </CardTitle>
            <CardDescription>
              These products are not connected to any Telegram groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                                     <TableHead>Product</TableHead>
                   <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmappedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.description}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {product.created_at ? new Date(product.created_at).toLocaleDateString() : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}