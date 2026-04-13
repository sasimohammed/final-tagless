import { useState } from "react";
import { Link } from "wouter";
import { useCart } from "@/lib/cart-context";
import { createOrder } from "@/lib/sanity";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Truck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Telegram configuration
const TELEGRAM_BOT_TOKEN = "8220264378:AAFr6GWBbnUi8wrrEAKqBhlJShJSeWgvEww";
const TELEGRAM_CHAT_ID = "743876299";

const sendTelegramNotification = async (message: string) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('Telegram API error:', await response.text());
    }
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
};

const formatTelegramMessage = (
    order: any,
    formData: any,
    items: any[],
    totalPrice: number,
    deliveryFee: number,
    finalTotal: number,
    shippingMethod: string
) => {
  const orderId = order._id?.slice(-8).toUpperCase() || order.orderNumber;
  const shippingText = shippingMethod === "standard" ? "Standard Delivery (2-3 business days)" : "Express Delivery (1-2 business days)";

  let productsList = "";
  items.forEach((item, index) => {
    productsList += `
${index + 1}. <b>${item.product.title}</b>
   Quantity: ${item.quantity}
   Price: ${item.product.price} EGP each
   Subtotal: ${(item.product.price * item.quantity).toFixed(2)} EGP
   ${item.selectedColor ? `Color: ${item.selectedColor}` : ''}
   ${item.selectedSize ? `Size: ${item.selectedSize}` : ''}
`;
  });

  return `
NEW ORDER RECEIVED!

Order Details:
Date: ${new Date().toLocaleString()}
Status: Pending

Customer Information:
Name: ${formData.firstName} ${formData.lastName}
Phone: ${formData.phone}
City: ${formData.city}
Governorate: ${formData.governorate}

Delivery Address:
${formData.address}
${formData.apartment ? `Apt: ${formData.apartment}` : ''}
${formData.city}, ${formData.governorate}


Order Items:
${productsList}

Order Summary:
Subtotal (${items.length} items): ${totalPrice.toFixed(2)} EGP
Delivery: ${deliveryFee.toFixed(2)} EGP
TOTAL: ${finalTotal.toFixed(2)} EGP


  `;
};

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();

  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  const deliveryFee = shippingMethod === "standard" ? 70 : 150;
  const finalTotal = totalPrice + deliveryFee;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    governorate: "",
    phone: "",
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.governorate.trim()) errors.governorate = "Governorate is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^[\d\s\+\-\(\)]{10,}$/.test(formData.phone)) errors.phone = "Invalid phone number";
    return errors;
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
      // Prepare order items
      const orderItems = items.map(item => ({
        productId: item.product._id,
        productTitle: item.product.title,
        quantity: item.quantity,
        selectedColor: item.selectedColor || undefined,
        selectedSize: item.selectedSize || undefined,
        price: item.product.price || 0
      }));

      const fullAddress = `${formData.address}${formData.apartment ? `, ${formData.apartment}` : ''}, ${formData.city}, ${formData.governorate}`;

      // 1. Create order in Sanity
      const order = await createOrder({
        customerName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        address: fullAddress,
        items: orderItems,
        total: finalTotal,
        status: "Pending",
      });

      // Generate order number
      const newOrderNumber = order._id?.slice(-8).toUpperCase() || `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setOrderNumber(newOrderNumber);

      // 2. Send Telegram notification
      const telegramMessage = formatTelegramMessage(
          { ...order, orderNumber: newOrderNumber },
          formData,
          items,
          totalPrice,
          deliveryFee,
          finalTotal,
          shippingMethod
      );

      await sendTelegramNotification(telegramMessage);

      // 3. Clear cart and show success
      clearCart();
      setSuccess(true);
    } catch (error) {
      console.error("Order failed:", error);
      alert(error instanceof Error ? error.message : "Failed to create order. Please try again.");
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
            <p className="text-muted-foreground mb-6">Looks like you haven't added any items yet</p>
            <Link href="/">
              <Button className="rounded-full">Continue Shopping</Button>
            </Link>
          </Card>
        </div>
    );
  }

  if (success) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-lg w-full">
            <Card className="border-2 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Order Confirmed! 🎉</h2>
                <Badge className="mb-4">Order #{orderNumber}</Badge>
                <p className="text-muted-foreground mb-6">
                  Thank you for your purchase! Your order has been received and will be processed soon.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  A confirmation has been sent to our team. We'll contact you shortly.
                </p>
                <Link href="/">
                  <Button className="rounded-full">Continue Shopping</Button>
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

            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
              <ShoppingBag className="h-8 w-8" />
              Your Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </h1>

            <div className="space-y-4">
              <AnimatePresence>
                {items.map((item, index) => (
                    <motion.div
                        key={`${item.productId}-${item.selectedColor}-${item.selectedSize}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="bg-background rounded-xl border-2 p-4"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary/30 border-2 flex-shrink-0">
                          {item.product.images?.[0]?.asset?.url ? (
                              <img
                                  src={item.product.images[0].asset.url}
                                  alt={item.product.title}
                                  className="w-full h-full object-cover"
                              />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold">{item.product.title}</h3>
                              <p className="text-sm text-muted-foreground">{item.product.price} EGP each</p>
                              {(item.selectedColor || item.selectedSize) && (
                                  <div className="flex gap-2 mt-1">
                                    {item.selectedColor && <Badge variant="outline">{item.selectedColor}</Badge>}
                                    {item.selectedSize && <Badge variant="outline">{item.selectedSize}</Badge>}
                                  </div>
                              )}
                            </div>
                            <button
                                onClick={() => removeFromCart(item.productId, item.selectedColor, item.selectedSize)}
                                className="text-muted-foreground hover:text-red-500 transition-colors"
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
                          {(item.product.price * item.quantity).toFixed(2)} EGP
                        </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                ))}
              </AnimatePresence>

              <div className="border-t pt-4 mt-8">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="text-primary">{totalPrice.toFixed(2)} EGP</span>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={clearCart} className="flex-1 rounded-full">
                    Clear Cart
                  </Button>
                  <Button onClick={() => setCheckout(true)} className="flex-1 rounded-full">
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <button
              onClick={() => setCheckout(false)}
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors group"
          >
            <div className="bg-background border rounded-full p-2 mr-3 group-hover:border-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Cart
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Delivery Information Form */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Delivery Information</h2>

                <div className="space-y-4">
                  {/* Country/Region */}
                  <div>
                    <Label>Country/Region</Label>
                    <Input value="Egypt" disabled className="bg-secondary/30" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <Label>First name <span className="text-red-500">*</span></Label>
                      <Input
                          placeholder="Ahmed"
                          value={formData.firstName}
                          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                          className={formErrors.firstName ? 'border-red-500' : ''}
                      />
                      {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
                    </div>

                    {/* Last Name */}
                    <div>
                      <Label>Last name <span className="text-red-500">*</span></Label>
                      <Input
                          placeholder="Mohamed"
                          value={formData.lastName}
                          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                          className={formErrors.lastName ? 'border-red-500' : ''}
                      />
                      {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label>Address <span className="text-red-500">*</span></Label>
                    <Input
                        placeholder="123 Main Street"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className={formErrors.address ? 'border-red-500' : ''}
                    />
                    {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
                  </div>

                  {/* Apartment (optional) */}
                  <div>
                    <Label>Apartment, suite, etc. (optional)</Label>
                    <Input
                        placeholder="Apt 4B, Floor 3"
                        value={formData.apartment}
                        onChange={e => setFormData({ ...formData, apartment: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* City */}
                    <div>
                      <Label>City <span className="text-red-500">*</span></Label>
                      <Input
                          placeholder="Cairo"
                          value={formData.city}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                          className={formErrors.city ? 'border-red-500' : ''}
                      />
                      {formErrors.city && <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>}
                    </div>

                    {/* Governorate */}
                    <div>
                      <Label>Governorate <span className="text-red-500">*</span></Label>
                      <Input
                          placeholder="Cairo"
                          value={formData.governorate}
                          onChange={e => setFormData({ ...formData, governorate: e.target.value })}
                          className={formErrors.governorate ? 'border-red-500' : ''}
                      />
                      {formErrors.governorate && <p className="text-xs text-red-500 mt-1">{formErrors.governorate}</p>}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label>Phone <span className="text-red-500">*</span></Label>
                    <Input
                        type="tel"
                        placeholder="01012345678"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className={formErrors.phone ? 'border-red-500' : ''}
                    />
                    {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary & Shipping Method */}
            <div className="space-y-6">
              {/* Shipping Method */}
              <Card className="border-2">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipping method
                  </h3>

                  <div className="space-y-3">
                    <div
                        className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-all ${
                            shippingMethod === "standard"
                                ? "border-primary bg-primary/5"
                                : "hover:bg-secondary/20"
                        }`}
                        onClick={() => setShippingMethod("standard")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                            shippingMethod === "standard"
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                        }`} />
                        <div>
                          <div className="font-medium">Standard Delivery</div>
                          <div className="text-xs text-muted-foreground">2-3 business days</div>
                        </div>
                      </div>
                      <span className="font-semibold">70 EGP</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="border-2">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Order Summary</h3>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                      <span>{totalPrice.toFixed(2)} EGP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span>{deliveryFee.toFixed(2)} EGP</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{finalTotal.toFixed(2)} EGP</span>
                    </div>
                  </div>

                  <Button
                      onClick={handleSubmit}
                      className="w-full mt-6 rounded-full h-12 text-base"
                      disabled={submitting}
                  >
                    {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                    ) : (
                        `Place Order • ${finalTotal.toFixed(2)} EGP`
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  );
}