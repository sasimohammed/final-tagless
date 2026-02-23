import { useState, useEffect } from "react";
import { getOrders, getProducts, updateOrderStatus, createProduct, updateProduct, deleteProduct, uploadImage, Order, Product } from "@/lib/sanity";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  X,
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";

const SECRET_SLUG = "admin-9f8a7s6d5f4e3r2t";

// Local image type for form state
interface FormImage {
  _key?: string;
  file?: File;
  url?: string;
  asset?: {
    _ref?: string;
    url?: string;
  };
  alt?: string;
  caption?: string;
}

export default function Admin() {
  const [location, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    price: 0,
    stock: 0,
    colors: [] as string[],
    sizes: [] as string[],
    description: "",
    images: [] as FormImage[],
  });
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const currentPath = location.split('?')[0];
    const secretPath = `/${SECRET_SLUG}`;

    if (currentPath === secretPath) {
      setIsAuthorized(true);
      loadData();
    } else {
      setLocation("/");
    }
  }, [location, setLocation]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([getOrders(), getProducts()]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate statistics
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const lowStockProducts = products.filter(p => p.stock < 10).length;
  const totalProducts = products.length;

  // --- Orders ---
  const handleStatusUpdate = async (orderId: string, currentStatus: Order['status']) => {
    const nextStatus: Record<Order['status'], Order['status']> = {
      'Pending': 'Shipped',
      'Shipped': 'Done',
      'Done': 'Pending'
    };
    const updatedOrder = await updateOrderStatus(orderId, nextStatus[currentStatus]);
    if (updatedOrder) {
      setOrders(orders.map(o => o._id === orderId ? updatedOrder : o));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900';
      case 'Shipped': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      case 'Done': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-3 h-3 mr-1" />;
      case 'Shipped': return <Truck className="w-3 h-3 mr-1" />;
      case 'Done': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- Products ---
  const openAddModal = () => {
    setEditingProduct(null);
    setForm({ title: "", slug: "", price: 0, stock: 0, colors: [], sizes: [], description: "", images: [] });
    setFormErrors({});
    setCurrentImageIndex(0);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    const productImages = (product.images || []).map(img => ({
      _key: img._key,
      asset: {
        _ref: img.asset?._ref,
        url: img.asset?.url
      },
      alt: img.alt || '',
      caption: img.caption || '',
    }));

    setEditingProduct(product);
    setForm({
      title: product.title || "",
      slug: product.slug?.current || "",
      price: product.price || 0,
      stock: product.stock || 0,
      colors: product.colors || [],
      sizes: product.sizes || [],
      description: product.description || "",
      images: productImages,
    });
    setFormErrors({});
    setCurrentImageIndex(0);
    setModalOpen(true);
  };

  const handleFormChange = (key: string, value: string | number) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const handleAddColor = () => {
    if (newColor.trim() && !form.colors.includes(newColor.trim())) {
      setForm(prev => ({ ...prev, colors: [...prev.colors, newColor.trim()] }));
      setNewColor("");
    }
  };

  const handleRemoveColor = (color: string) => {
    setForm(prev => ({ ...prev, colors: prev.colors.filter(c => c !== color) }));
  };

  const handleAddSize = () => {
    if (newSize.trim() && !form.sizes.includes(newSize.trim())) {
      setForm(prev => ({ ...prev, sizes: [...prev.sizes, newSize.trim()] }));
      setNewSize("");
    }
  };

  const handleRemoveSize = (size: string) => {
    setForm(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== size) }));
  };

  // Handle image selection - store files for later upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: FormImage[] = [];

    Array.from(files).forEach((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      newImages.push({
        _key: `temp-${Date.now()}-${index}`,
        file: file,
        url: objectUrl,
        alt: file.name,
        caption: "",
      });
    });

    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));

    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    // Revoke object URL to free memory
    if (form.images[index]?.url) {
      URL.revokeObjectURL(form.images[index].url!);
    }

    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    if (currentImageIndex >= index && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const handleImageAltChange = (index: number, alt: string) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? { ...img, alt } : img
      )
    }));
  };

  const nextImage = () => {
    if (form.images.length > 0) {
      setCurrentImageIndex(prev => (prev + 1) % form.images.length);
    }
  };

  const prevImage = () => {
    if (form.images.length > 0) {
      setCurrentImageIndex(prev => (prev - 1 + form.images.length) % form.images.length);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.title) errors.title = "Title is required";
    if (form.price <= 0) errors.price = "Price must be greater than 0";
    if (form.stock < 0) errors.stock = "Stock cannot be negative";
    if (form.images.length === 0) errors.images = "At least one image is required";
    return errors;
  };

  const handleSaveProduct = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setUploadingImages(true);

    try {
      // Separate existing images from new images that need uploading
      const existingImages = form.images.filter(img => img.asset?._ref && !img.file);
      const newImages = form.images.filter(img => img.file);

      // Upload new images to Sanity
      const uploadedImages = [];

      for (const img of newImages) {
        if (img.file) {
          try {
            // Upload the file using the Sanity client
            const asset = await uploadImage(img.file);

            uploadedImages.push({
              _key: img._key,
              asset: {
                _ref: asset._id,
                url: asset.url
              },
              alt: img.alt || '',
              caption: img.caption || '',
            });
          } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Failed to upload one or more images. Please try again.');
            setUploadingImages(false);
            return;
          }
        }
      }

      // Combine existing and newly uploaded images
      const allImages = [...existingImages, ...uploadedImages];

      // Prepare product data
      const productData = {
        title: form.title,
        slug: {
          current: form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        },
        price: Number(form.price),
        stock: Number(form.stock),
        colors: form.colors,
        sizes: form.sizes,
        description: form.description,
        images: allImages,
      };

      if (editingProduct) {
        const updated = await updateProduct(editingProduct._id, productData);
        if (updated) {
          setProducts(products.map(p => p._id === updated._id ? updated : p));
        }
      } else {
        const created = await createProduct(productData);
        if (created) {
          setProducts([...products, created]);
        }
      }

      // Clean up object URLs
      form.images.forEach(img => {
        if (img.url) URL.revokeObjectURL(img.url);
      });

      setModalOpen(false);

    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setUploadingImages(false);
    }

  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(productId);
      setProducts(products.filter(p => p._id !== productId));
    }
  };

  // Filter products for search
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Manage your store operations efficiently</p>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export report</TooltipContent>
              </Tooltip>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">+12.5% from last month</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-3xl font-bold">{orders.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{pendingOrders} pending</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                    <p className="text-3xl font-bold">{totalProducts}</p>
                    <p className="text-xs text-muted-foreground mt-1">{lowStockProducts} low stock</p>
                  </div>
                  <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Low Stock Alert</p>
                    <p className="text-3xl font-bold">{lowStockProducts}</p>
                    <Progress value={(lowStockProducts / totalProducts) * 100} className="mt-2" />
                  </div>
                  <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders or products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2 p-1">
              <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Package className="w-4 h-4 mr-2" />
                Products
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-2">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-xl">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4">
                        {filteredOrders.map((order, index) => (
                          <motion.div
                            key={order._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative"
                          >
                            <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20">
                              <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div className="flex items-start gap-4">
                                    <Avatar className="h-12 w-12 border-2">
                                      <AvatarFallback className="bg-primary/10">
                                        {order.customerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="font-semibold text-lg">{order.customerName}</h3>
                                      <p className="text-sm text-muted-foreground">{order.phone}</p>
                                      <p className="text-sm text-muted-foreground mt-1">{order.address}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col md:items-end gap-2">
                                    <Badge className={`${getStatusColor(order.status)} flex items-center px-3 py-1`}>
                                      {getStatusIcon(order.status)}
                                      {order.status}
                                    </Badge>
                                    <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                                  </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="flex flex-wrap gap-3">
                                  {order.items.map((item, idx) => {
                                    const product = products.find(p => p._id === item.productId);
                                    return (
                                      <Badge key={idx} variant="secondary" className="px-3 py-1">
                                        {product?.title || "Unknown"} × {item.quantity}
                                      </Badge>
                                    );
                                  })}
                                </div>

                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleStatusUpdate(order._id, order.status)}>
                                        <Truck className="h-4 w-4 mr-2" />
                                        Update Status
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}

                        {filteredOrders.length === 0 && (
                          <div className="text-center py-12">
                            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground mt-4">No orders found</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-2">
                  <CardHeader className="pb-0 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Product Inventory</CardTitle>
                    <Button onClick={openAddModal} className="gap-2">
                      <Plus className="w-4 h-4" /> Add Product
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-4">
                        {filteredProducts.map((product, index) => {
                          const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
                          const imageUrl = firstImage?.asset?.url || '';
                          const imageCount = product.images?.length || 0;

                          return (
                            <motion.div
                              key={product._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="group relative"
                            >
                              <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-secondary to-secondary/50 overflow-hidden border-2 flex-shrink-0">
                                      {imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={product.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-1">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h3 className="font-semibold">{product.title}</h3>
                                          <p className="text-sm text-muted-foreground line-clamp-1">
                                            {product.description || "No description"}
                                          </p>
                                          {imageCount > 1 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {imageCount} images
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => openEditModal(product)}
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Edit product</TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteProduct(product._id)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Delete product</TooltipContent>
                                          </Tooltip>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-2 mt-2">
                                        <Badge variant="secondary">${product.price.toFixed(2)}</Badge>
                                        <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
                                          Stock: {product.stock}
                                        </Badge>
                                        {(product.colors || []).map(color => (
                                          <Badge key={color} variant="outline" className="gap-1">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                            {color}
                                          </Badge>
                                        ))}
                                        {(product.sizes || []).map(size => (
                                          <Badge key={size} variant="outline">
                                            {size}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}

                        {filteredProducts.length === 0 && (
                          <div className="text-center py-12">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
                            <p className="text-muted-foreground mt-4">No products found</p>
                            <Button onClick={openAddModal} variant="outline" className="mt-4">
                              <Plus className="h-4 w-4 mr-2" /> Add your first product
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Product Modal */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4 mt-4">
                {/* Images Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Images *</label>

                  {/* Image Gallery */}
                  {form.images.length > 0 && (
                    <div className="relative mb-4">
                      <div className="w-full h-64 bg-secondary/20 rounded-lg overflow-hidden border-2">
                        <img
                          src={form.images[currentImageIndex]?.url || form.images[currentImageIndex]?.asset?.url || ''}
                          alt={form.images[currentImageIndex]?.alt || `Product ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+not+found';
                          }}
                        />
                      </div>

                      {form.images.length > 1 && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                            onClick={prevImage}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                            onClick={nextImage}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs">
                        {currentImageIndex + 1} / {form.images.length}
                      </div>
                    </div>
                  )}

                  {/* Image Thumbnails */}
                  <div className="flex gap-2 flex-wrap">
                    {form.images.map((img, index) => (
                      <div
                        key={img._key || index}
                        className={`relative group w-16 h-16 rounded-lg border-2 overflow-hidden cursor-pointer ${
                          index === currentImageIndex ? 'border-primary' : 'border-border'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={img.url || img.asset?.url || ''}
                          alt={img.alt || `Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Error';
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-0 right-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}

                    {/* Image Upload Input */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          disabled={uploadingImages}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1 w-full"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          disabled={uploadingImages}
                        >
                          {uploadingImages ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Images
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        You can select multiple images
                      </p>
                    </div>
                  </div>

                  {/* Alt text input for current image */}
                  {form.images.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium">Image Alt Text (SEO)</label>
                      <Input
                        placeholder="Describe this image for SEO..."
                        value={form.images[currentImageIndex]?.alt || ""}
                        onChange={(e) => handleImageAltChange(currentImageIndex, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {formErrors.images && (
                    <p className="text-xs text-destructive">{formErrors.images}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="Product title"
                    value={form.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    className={formErrors.title ? "border-destructive" : ""}
                  />
                  {formErrors.title && (
                    <p className="text-xs text-destructive">{formErrors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug (optional)</label>
                  <Input
                    placeholder="product-slug"
                    value={form.slug}
                    onChange={(e) => handleFormChange("slug", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price *</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => handleFormChange("price", parseFloat(e.target.value))}
                      className={formErrors.price ? "border-destructive" : ""}
                    />
                    {formErrors.price && (
                      <p className="text-xs text-destructive">{formErrors.price}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock *</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.stock}
                      onChange={(e) => handleFormChange("stock", parseInt(e.target.value))}
                      className={formErrors.stock ? "border-destructive" : ""}
                    />
                    {formErrors.stock && (
                      <p className="text-xs text-destructive">{formErrors.stock}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Colors</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add color (e.g., Red, Blue)"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddColor()}
                    />
                    <Button size="sm" onClick={handleAddColor} variant="secondary">Add</Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <AnimatePresence>
                      {form.colors.map(color => (
                        <motion.div
                          key={color}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Badge
                            variant="secondary"
                            className="cursor-pointer px-3 py-1 gap-1 group"
                            onClick={() => handleRemoveColor(color)}
                          >
                            {color}
                            <X className="w-3 h-3 group-hover:text-destructive transition-colors" />
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sizes</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add size (e.g., S, M, L, XL)"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSize()}
                    />
                    <Button size="sm" onClick={handleAddSize} variant="secondary">Add</Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <AnimatePresence>
                      {form.sizes.map(size => (
                        <motion.div
                          key={size}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Badge
                            variant="secondary"
                            className="cursor-pointer px-3 py-1 gap-1 group"
                            onClick={() => handleRemoveSize(size)}
                          >
                            {size}
                            <X className="w-3 h-3 group-hover:text-destructive transition-colors" />
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Product description..."
                    value={form.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProduct} className="gap-2" disabled={uploadingImages}>
                  {uploadingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : editingProduct ? (
                    <>
                      <Edit className="h-4 w-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Product
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}