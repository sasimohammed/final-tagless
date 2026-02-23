import { useState } from "react";
import { Link } from "wouter";
import { useCart } from "@/lib/cart-context";
import { createOrder } from "@/lib/sanity";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  Minus,
  Plus,
  Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();

  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    city: ""
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^[\d\s\+\-\(\)]{10,}$/.test(formData.phone)) errors.phone = "Invalid phone number";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email address";
    }
    return errors;
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

CUSTOMER DETAILS:
- Name: ${formData.name}
- Phone: ${formData.phone}
${formData.email ? `- Email: ${formData.email}` : ''}
- City: ${formData.city}

ORDER ITEMS:
${productsList}

SHIPPING ADDRESS:
${formData.address}, ${formData.city}

ORDER TOTAL: $${totalPrice.toFixed(2)}
TOTAL ITEMS: ${totalItems}
STATUS: Pending

#NewOrder #Total${totalItems}
    `;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

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

      const orderResult = await createOrder({
        customerName: formData.name,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city}`,
        items: orderItems,
        total: totalPrice,
        status: "Pending",
      });

      const newOrderNumber = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setOrderNumber(newOrderNumber);

      await sendTelegramNotification(formatTelegramMessage({ ...orderResult, orderId: newOrderNumber }));

      clearCart();
      setSuccess(true);
    } catch (error) {
      console.error("Order failed:", error);
      alert(error instanceof Error ? error.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !success && !checkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-2">
          <ShoppingBag className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
          <Link href="/">
            <Button className="mt-4">Continue Shopping</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-lg w-full">
          <Card className="border-2">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Order Confirmed! 🎉</h2>
              <Badge className="mb-4">Order #{orderNumber}</Badge>
              <p className="text-muted-foreground mb-6">Thank you for your purchase!</p>
              <Link href="/">
                <Button>Continue Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            Your Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h1>

          <div className="space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-background rounded-xl border-2 p-4"
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary/30 border-2 flex-shrink-0">
                      <img
                        src={item.product.images?.[0]?.asset?.url || item.product.image?.asset?.url}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">{item.product.title}</h3>
                          <p className="text-sm text-muted-foreground">${item.product.price} each</p>
                          {(item.selectedColor || item.selectedSize) && (
                            <div className="flex gap-2 mt-1">
                              {item.selectedColor && <Badge variant="outline">{item.selectedColor}</Badge>}
                              {item.selectedSize && <Badge variant="outline">{item.selectedSize}</Badge>}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId, item.selectedColor, item.selectedSize)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 bg-secondary/30 rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.selectedColor, item.selectedSize)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 rounded-full hover:bg-background disabled:opacity-50 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.selectedColor, item.selectedSize)}
                            disabled={item.product.stock ? item.quantity >= item.product.stock : false}
                            className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-primary">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="border-t pt-4 mt-8">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total</span>
                <span className="text-primary">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={clearCart} className="flex-1">
                  Clear Cart
                </Button>
                <Button onClick={() => setCheckout(true)} className="flex-1">
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Checkout Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button onClick={() => setCheckout(false)} className="flex items-center text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </button>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Checkout Details</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className={`pl-9 ${formErrors.name ? 'border-red-500' : ''}`}
                  />
                </div>
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <Label>Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className={`pl-9 ${formErrors.phone ? 'border-red-500' : ''}`}
                  />
                </div>
                {formErrors.phone && <p className="text-xs text-red-500">{formErrors.phone}</p>}
              </div>

              <div>
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
              </div>

              <div>
                <Label>Street Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    placeholder="123 Main St, Apt 4B"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className={`pl-9 ${formErrors.address ? 'border-red-500' : ''}`}
                    rows={2}
                  />
                </div>
                {formErrors.address && <p className="text-xs text-red-500">{formErrors.address}</p>}
              </div>

              <div>
                <Label>City *</Label>
                <Input
                  placeholder="New York"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className={formErrors.city ? 'border-red-500' : ''}
                />
                {formErrors.city && <p className="text-xs text-red-500">{formErrors.city}</p>}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg rounded-xl"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Place Order • ${totalPrice.toFixed(2)}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}