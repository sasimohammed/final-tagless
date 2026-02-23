import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { getProductById, createOrder, Product } from "@/lib/sanity";
import { useCart } from "@/lib/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ShoppingBag,
  Package,
  AlertCircle,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  Check,
  Heart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Telegram configuration
const TELEGRAM_BOT_TOKEN = "8220264378:AAFr6GWBbnUi8wrrEAKqBhlJShJSeWgvEww";
const TELEGRAM_CHAT_ID = "1948053692";

const sendTelegramNotification = async (message: string) => {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
};

export default function Checkout() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const productId = searchParams.get('id');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Image slider
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const { items, addToCart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (productId) {
      getProductById(productId).then(data => {
        setProduct(data);
        if (data?.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
        if (data?.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        setLoading(false);
      });
    }
  }, [productId]);

  // Get all images
  const getAllImages = () => {
    const images = [];
    if (product?.images && product.images.length > 0) {
      images.push(...product.images);
    }
    if (product?.image?.asset?.url && !images.some((img: any) => img.asset?.url === product.image?.asset?.url)) {
      images.push({ asset: { url: product.image.asset.url } });
    }
    return images;
  };

  const allImages = getAllImages();

  const nextImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }
  };

  const prevImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(
      product,
      quantity,
      selectedColor || undefined,
      selectedSize || undefined
    );

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const formatTelegramMessage = (orderData: any) => {
    const orderId = orderData.orderId || `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    let productsList = "";
    items.forEach((item, index) => {
      productsList += `
${index + 1}. ${item.product.title} x ${item.quantity} - $${(item.product.price * item.quantity).toFixed(2)}
${item.selectedColor ? `   Color: ${item.selectedColor}` : ''}
${item.selectedSize ? `   Size: ${item.selectedSize}` : ''}`;
    });

    return `
NEW ORDER RECEIVED!

Order ID: ${orderId}
Date: ${new Date().toLocaleString()}

CUSTOMER WILL PROVIDE DETAILS VIA CALL/CHAT

ORDER ITEMS:
${productsList}

ORDER TOTAL: $${totalPrice.toFixed(2)}
TOTAL ITEMS: ${totalItems}
STATUS: Pending (Customer will contact)

#NewOrder #Total${totalItems}
    `;
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setSubmitting(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.product._id,
        productTitle: item.product.title,
        quantity: item.quantity,
        selectedColor: item.selectedColor || undefined,
        selectedSize: item.selectedSize || undefined,
        price: item.product.price || 0
      }));

      await createOrder({
        customerName: "Customer will provide",
        phone: "To be provided",
        address: "To be provided",
        items: orderItems,
        total: totalPrice,
        status: "Pending",
      });

      const newOrderNumber = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setOrderNumber(newOrderNumber);

      await sendTelegramNotification(formatTelegramMessage({ orderId: newOrderNumber }));

      clearCart();
      setSuccess(true);
    } catch (error) {
      console.error("Order failed:", error);
      alert(error instanceof Error ? error.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-2">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <Link href="/">
            <Button className="mt-4">Back to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="border-2 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Order Initiated! 🎉</h2>
              <Badge className="mb-4">Order #{orderNumber}</Badge>
              <p className="text-muted-foreground mb-6">
                We'll contact you shortly to confirm your order!
              </p>
              <Link href="/">
                <Button className="w-full rounded-full">Continue Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <Link href="/">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors group"
          >
            <div className="bg-background border rounded-full p-2 mr-3 group-hover:border-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to products
          </motion.button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/30 border-2 group">
              <img
                src={allImages[currentImageIndex]?.asset?.url || product.image?.asset?.url}
                alt={product.title}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                onClick={() => setShowLightbox(true)}
              />

              {/* Image Navigation */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={img.asset?.url}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right Column - Product Details & Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Product Info */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl font-bold">{product.title}</h1>
                <Badge variant="secondary" className="text-xl px-4 py-2">
                  ${product.price}
                </Badge>
              </div>

              <p className="text-lg text-muted-foreground mb-6">
                {product.description}
              </p>

              {/* Stock Status */}
              {product.stock !== undefined && (
                <div className="mb-6">
                  <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"} className="text-sm">
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Color</label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <Badge
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      className={`px-4 py-2 cursor-pointer transition-all text-sm ${
                        selectedColor === color
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-primary/10'
                      }`}
                      onClick={() => setSelectedColor(color)}
                    >
                      <span
                        className="w-3 h-3 rounded-full mr-2 inline-block"
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <Badge
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      className={`px-4 py-2 cursor-pointer transition-all text-sm ${
                        selectedSize === size
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-primary/10'
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <div className="flex items-center gap-4 bg-secondary/30 rounded-full p-1 w-fit">
                  <button
                    className="w-10 h-10 flex items-center justify-center hover:bg-background rounded-full transition-colors"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className={`w-4 h-4 ${quantity <= 1 ? 'opacity-50' : ''}`} />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button
                    className="w-10 h-10 flex items-center justify-center hover:bg-background rounded-full transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.stock ? quantity >= product.stock : false}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-primary to-primary/80"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {addedToCart ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </Button>

              {/* Cart Summary Button */}
              {items.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                  onClick={() => setShowCart(!showCart)}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'}) • ${totalPrice.toFixed(2)}
                </Button>
              )}
            </div>

            {/* Cart Items (Expandable) */}
            <AnimatePresence>
              {showCart && items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card className="border-2 mt-4">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Your Cart</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {items.map((item) => (
                          <div key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">{item.product.title}</span>
                              <div className="text-xs text-muted-foreground">
                                {item.selectedColor && <span>Color: {item.selectedColor} </span>}
                                {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                              </div>
                              <span>x{item.quantity}</span>
                            </div>
                            <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>
                      <Button
                        className="w-full mt-3 rounded-full"
                        onClick={handleCheckout}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          'Place Order'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setShowLightbox(false)}
          >
            <button className="absolute top-4 right-4 text-white">
              <X className="h-8 w-8" />
            </button>
            <img
              src={allImages[currentImageIndex]?.asset?.url || product.image?.asset?.url}
              alt={product.title}
              className="max-h-[90vh] max-w-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}