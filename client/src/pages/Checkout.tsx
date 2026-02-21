import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getProductById, createOrder, Product } from "@/lib/sanity";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Checkout() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const productId = searchParams.get('product');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (productId) {
      getProductById(productId).then(data => {
        if (data) setProduct(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setSubmitting(true);
    
    try {
      await createOrder({
        customerName: formData.name,
        phone: formData.phone,
        address: formData.address,
        items: [{ productId: product._id, quantity }],
        total: product.price * quantity,
      });
      
      setSuccess(true);
    } catch (error) {
      console.error("Order failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-24 min-h-[70vh] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center bg-card p-10 rounded-2xl border shadow-sm"
        >
          <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4" data-testid="text-order-success">Order Confirmed</h2>
          <p className="text-muted-foreground mb-8">
            Thank you for your purchase, {formData.name}. We'll process your order right away.
          </p>
          <Link href="/">
            <Button className="w-full rounded-full h-12 text-base">
              Continue Shopping
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">No product selected</h2>
        <Link href="/">
          <Button variant="outline">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <Link href="/">
        <button className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to products
        </button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        {/* Product Details */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="aspect-square rounded-2xl overflow-hidden bg-secondary">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-2xl mb-6">${product.price}</p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              {product.description}
            </p>
            
            <div className="flex items-center gap-4 py-6 border-y border-border">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center bg-secondary rounded-full">
                <button 
                  className="w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  data-testid="button-decrease-qty"
                >-</button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button 
                  className="w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors"
                  onClick={() => setQuantity(quantity + 1)}
                  data-testid="button-increase-qty"
                >+</button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-6 text-xl font-bold">
              <span>Total</span>
              <span>${product.price * quantity}</span>
            </div>
          </div>
        </motion.div>

        {/* Order Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border rounded-3xl p-8 lg:p-12 shadow-sm h-fit sticky top-24"
        >
          <h2 className="text-2xl font-bold mb-8">Shipping Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="h-12 bg-secondary/50 border-none rounded-xl px-4"
                placeholder="John Doe"
                data-testid="input-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                required 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="h-12 bg-secondary/50 border-none rounded-xl px-4"
                placeholder="+1 (555) 000-0000"
                data-testid="input-phone"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea 
                id="address" 
                required 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="min-h-[120px] bg-secondary/50 border-none rounded-xl p-4 resize-none"
                placeholder="123 Main St, Apt 4B&#10;City, State, Zip"
                data-testid="input-address"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 text-lg rounded-xl mt-4" 
              disabled={submitting}
              data-testid="button-submit-order"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
              ) : (
                `Complete Order • $${product.price * quantity}`
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
              Secure checkout. No account required.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}