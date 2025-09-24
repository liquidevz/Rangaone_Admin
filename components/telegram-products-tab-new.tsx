// components/telegram-products-tab-new.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, RefreshCw, Trash2, Link } from "lucide-react";
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  getProducts,
  createProduct,
  deleteProduct,
  mapProductToGroup,
  getGroups,
  getProductGroupMapping,
  TelegramGroup,
} from "@/lib/api-telegram-bot";
import { fetchPortfolios, type Portfolio } from "@/lib/api";
import { fetchBundles, type Bundle } from "@/lib/api-bundles";

export function ProductsTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [productMappings, setProductMappings] = useState<Record<string, { telegram_group_id: string; telegram_group_name: string } | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mapFormData, setMapFormData] = useState({ telegram_group_id: '', telegram_group_name: '' });
  const [selectedType, setSelectedType] = useState<'portfolio' | 'bundle'>('portfolio');
  const [formData, setFormData] = useState<CreateProductRequest & { 
    portfolio_id?: string; 
    bundle_id?: string; 
  }>({
    name: '',
    description: '',
    price: 0,
    portfolio_id: '',
    bundle_id: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
       console.log('Loading products from Telegram API...');
       const [productsData, portfoliosData, bundlesData, groupsData] = await Promise.all([
         getProducts().catch((error) => {
           console.error('Failed to load Telegram products:', error);
           toast({
             title: "Warning",
             description: `Failed to load Telegram products: ${error.message}`,
             variant: "destructive",
           });
           return [];
         }),
        fetchPortfolios().catch(() => []),
        fetchBundles().catch(() => []),
        getGroups().catch(() => []),
       ]);
       
       console.log('Products loaded from API:', productsData);
       
       // Clean and validate data - ensure only real API data
       const cleanPortfolios = portfoliosData.filter(p => p && p.name && (p.id || p._id));
       const cleanBundles = bundlesData.filter(b => b && b.name && (b.id || b._id));
      
      setProducts(productsData);
      setPortfolios(cleanPortfolios);
      setBundles(cleanBundles);
      setGroups(groupsData);
      
      // Load group mappings for each product
      const mappings: Record<string, { telegram_group_id: string; telegram_group_name: string } | null> = {};
      for (const product of productsData) {
        try {
          const mapping = await getProductGroupMapping(String(product.id));
          mappings[String(product.id)] = mapping;
        } catch (error) {
          console.warn(`Failed to load mapping for product ${product.id}:`, error);
          mappings[String(product.id)] = null;
        }
      }
      setProductMappings(mappings);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

    const handleCreateProduct = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields with valid values",
        variant: "destructive",
      });
      return;
    }

    if (selectedType === 'portfolio' && !formData.portfolio_id) {
        toast({
          title: "Error",
        description: "Please select a portfolio",
          variant: "destructive",
        });
        return;
      }

    if (selectedType === 'bundle' && !formData.bundle_id) {
      toast({
        title: "Error",
        description: "Please select a bundle",
        variant: "destructive",
      });
      return;
    }

    try {
             // Create product data - include ID from selected portfolio/bundle
       const sourceId = selectedType === 'portfolio' ? formData.portfolio_id : formData.bundle_id;
       if (!sourceId) {
         toast({
           title: "Error",
           description: "Please select a portfolio or bundle first",
           variant: "destructive",
         });
         return;
       }
       
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price || 0,
        category: 'telegram_product'
      };

       console.log('Creating product with data:', productData);
      
      // Call the actual API to create the product
      console.log('Calling createProduct API with:', productData);
      const newProduct = await createProduct(productData);
      console.log('Product created successfully:', newProduct);

      // Refresh the products list from the server to get the latest data
      console.log('Refreshing products list...');
      await loadData();
      
      toast({
        title: "Success",
        description: `Product "${formData.name}" created successfully! ${newProduct.id ? `ID: ${newProduct.id}` : ''}`,
      });
      
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '', price: 0, portfolio_id: '', bundle_id: '' });
      setSelectedType('portfolio');
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to create product: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleMapProduct = async () => {
    if (!selectedProduct || !mapFormData.telegram_group_id || !mapFormData.telegram_group_name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await mapProductToGroup(String(selectedProduct.id), {
        telegram_group_id: mapFormData.telegram_group_id,
        telegram_group_name: mapFormData.telegram_group_name,
      });

      toast({
        title: "Success",
        description: `Product mapped to group successfully`,
      });

      setIsMapDialogOpen(false);
      setMapFormData({ telegram_group_id: '', telegram_group_name: '' });
      await loadData();
    } catch (error) {
      console.error('Error mapping product:', error);
      toast({
        title: "Error",
        description: "Failed to map product to group",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string | number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      // Call the actual API to delete the product
      await deleteProduct(String(productId));
      
      // Remove the product from local state
      setProducts(prevProducts => prevProducts.filter(p => String(p.id) !== String(productId)));
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to delete product: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handlePortfolioSelect = (portfolioId: string) => {
    const portfolio = portfolios.find(p => (p.id || p._id) === portfolioId);
    if (portfolio) {
      // Extract description text from description array
      const description = Array.isArray(portfolio.description) 
        ? portfolio.description.map(item => item.value || '').join(' ')
        : String(portfolio.description || '');
      
             // Get price from subscription fee
       const price = portfolio.subscriptionFee?.[0]?.price || 0;
       

       
       setFormData({
         ...formData,
         name: portfolio.name,
         description: portfolio.name, // Use only the title, not the full description
         portfolio_id: portfolioId,
         bundle_id: undefined,
       });
    }
  };

  const handleBundleSelect = (bundleId: string) => {
    const bundle = bundles.find(b => (b.id || b._id) === bundleId);
    if (bundle) {
             // Use monthly price, quarterly price, or yearly price as default
       const price = bundle.monthlyPrice || bundle.quarterlyPrice || bundle.yearlyPrice || 0;
       

       
       setFormData({
         ...formData,
         name: bundle.name,
         description: bundle.description,
         bundle_id: bundleId,
         portfolio_id: undefined,
       });
    }
  };

  // Edit dialog functionality removed since Telegram API is not available
  // const openEditDialog = (product: Product) => {
  //   setEditingProduct(product);
  //   setEditFormData({
  //     name: product.name,
  //     description: product.description,
  //     price: product.price,
  //   });
  //   setIsEditDialogOpen(true);
  // };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading products...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
                     if (open) {
             // Reset form when opening dialog
             setFormData({ name: '', description: '', price: 0, portfolio_id: '', bundle_id: '' });
             setSelectedType('portfolio');
           }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent>
          <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
                Create a new product for your Telegram bot
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
                            <div>
                <Label htmlFor="type">Product Type</Label>
                      <Select
                  value={selectedType} 
                                     onValueChange={(value: 'portfolio' | 'bundle') => {
                     setSelectedType(value);
                     setFormData({ name: '', description: '', price: 0, portfolio_id: '', bundle_id: '' });
                   }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                        </SelectContent>
                      </Select>
              </div>

              <div>
                <Label htmlFor="source">
                  Select {selectedType === 'portfolio' ? 'Portfolio' : 'Bundle'}
                </Label>
                <Select
                  value={selectedType === 'portfolio' ? (formData.portfolio_id || '') : (formData.bundle_id || '')} 
                  onValueChange={(value) => {
                    
                    if (selectedType === 'portfolio') {
                      handlePortfolioSelect(value);
                    } else {
                      handleBundleSelect(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${selectedType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedType === 'portfolio' 
                      ? (portfolios.length > 0 ? portfolios.map((portfolio) => {
                          const portfolioId = portfolio.id || portfolio._id;
                          
                          return (
                            <SelectItem 
                              key={portfolioId} 
                              value={String(portfolioId)}
                            >
                              {portfolio.name}
                            </SelectItem>
                          );
                        }) : [<SelectItem key="no-portfolios" value="" disabled>No portfolios available</SelectItem>])
                      : (bundles.length > 0 ? bundles.map((bundle) => {
                          const bundleId = bundle.id || bundle._id;
                          
                          return (
                            <SelectItem 
                              key={bundleId} 
                              value={String(bundleId)}
                            >
                              {bundle.name} - {bundle.category}
                            </SelectItem>
                          );
                        }) : [<SelectItem key="no-bundles" value="" disabled>No bundles available</SelectItem>])
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name (auto-filled from selection)"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description (auto-filled from selection)"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="Product price"
                />
              </div>
              
              <div>
                <Label htmlFor="id">Source ID</Label>
                <Input
                  id="id"
                  value={selectedType === 'portfolio' ? formData.portfolio_id : formData.bundle_id}
                  readOnly
                  placeholder={`${selectedType} ID (auto-filled from selection)`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This ID will be used to link the product to the selected {selectedType}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProduct}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Available Items Summary */}
      {(portfolios.length > 0 || bundles.length > 0) && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium mb-3">Available Items</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolios.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">
                  Portfolios ({portfolios.length})
                </Label>
                <div className="mt-1 text-xs text-muted-foreground">
                  {portfolios.slice(0, 3).map(p => `${p.name} (${p.id || p._id})`).join(', ')}
                  {portfolios.length > 3 && ` + ${portfolios.length - 3} more`}
                </div>
              </div>
            )}
            {bundles.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">
                  Bundles ({bundles.length})
                </Label>
                <div className="mt-1 text-xs text-muted-foreground">
                  {bundles.slice(0, 3).map(b => `${b.name} (${b.id || b._id})`).join(', ')}
                  {bundles.length > 3 && ` + ${bundles.length - 3} more`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

                    {/* Products Table */}
        <div className="border rounded-lg overflow-x-auto">
          {products.length > 0 && (
            <div className="p-4 border-b bg-green-50">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {products.length} Product{products.length > 1 ? 's' : ''} Created
                </span>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Product Details</TableHead>
                <TableHead className="min-w-[120px]">Price & Category</TableHead>
                <TableHead className="min-w-[150px]">Group Mapping</TableHead>
                <TableHead className="min-w-[100px]">Created</TableHead>
                <TableHead className="min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
                       <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    <div className="py-8">
                      <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm">No products available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create your first product using the form above
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    {/* Product Details */}
                    <TableCell>
                      <div className="max-w-[200px]">
                        <div className="font-medium truncate" title={product.name}>{product.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2" title={product.description}>
                          {product.description}
                        </div>
                        <div className="text-xs text-blue-600 mt-1 truncate">
                          ID: {product.id}
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Price & Category */}
                    <TableCell>
                      <div>
                        {product.price !== undefined && (
                          <div className="text-sm font-medium">
                            ${product.price}
                          </div>
                        )}
                        {product.category && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Group Mapping Status */}
                    <TableCell>
                      {productMappings[String(product.id)] ? (
                        <div>
                          <Badge variant="default" className="bg-green-100 text-green-800 mb-1">
                            Mapped
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {productMappings[String(product.id)]?.telegram_group_name}
                          </div>
                          <div className="text-xs text-blue-600">
                            ID: {productMappings[String(product.id)]?.telegram_group_id}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          Unmapped
                        </Badge>
                      )}
                    </TableCell>
                    
                    {/* Created Date */}
                    <TableCell>
                      <div className="text-sm">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString() : ''}
                      </div>
                      {product.updated_at && product.updated_at !== product.created_at && (
                        <div className="text-xs text-muted-foreground">
                          Updated: {new Date(product.updated_at).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Actions */}
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsMapDialogOpen(true);
                          }}
                          title="Map to Telegram Group"
                        >
                          <Link className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Delete Product"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
         </Table>
       </div>

             {/* Edit Dialog - Disabled since Telegram API is not available */}
       {/* <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Product</DialogTitle>
             <DialogDescription>
               Update product information
             </DialogDescription>
           </DialogHeader>
           {editingProduct && (
             <div className="space-y-4">
               <div>
                 <Label htmlFor="edit-name">Name</Label>
                 <Input
                   id="edit-name"
                   value={editFormData.name || ''}
                   onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                 />
               </div>
               <div>
                 <Label htmlFor="edit-description">Description</Label>
                 <Textarea
                   id="edit-description"
                   value={editFormData.description || ''}
                   onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                 />
               </div>
               <div>
                 <Label htmlFor="edit-price">Price ($)</Label>
                 <Input
                   id="edit-price"
                   type="number"
                   step="0.01"
                   value={editFormData.price || 0}
                   onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                 />
               </div>
               <div className="flex justify-end space-x-2">
                 <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
                 <Button onClick={handleUpdateProduct}>Update</Button>
               </div>
             </div>
           )}
        </DialogContent>
       </Dialog> */}
      {/* Map Product Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map Product to Telegram Group</DialogTitle>
            <DialogDescription>
              Map "{selectedProduct?.name}" to a Telegram group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-id">Telegram Group ID</Label>
              <Input
                id="group-id"
                value={mapFormData.telegram_group_id}
                onChange={(e) => setMapFormData({ ...mapFormData, telegram_group_id: e.target.value })}
                placeholder="-1001234567890"
              />
            </div>
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={mapFormData.telegram_group_name}
                onChange={(e) => setMapFormData({ ...mapFormData, telegram_group_name: e.target.value })}
                placeholder="Your Group Name"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsMapDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMapProduct}>Map Product</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}