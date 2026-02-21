import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getProducts, Product } from "@/lib/sanity";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-secondary">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90 z-10" />
        <div className="container relative z-20 text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Essentials, refined.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Super modern, clean, and minimalistic products for your everyday life. We believe in simplicity over noise.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Button size="lg" className="rounded-full px-8 text-base h-12" onClick={() => {
              document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Shop Collection
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Carousel Section */}
      {!loading && products.length > 0 && (
        <section id="featured" className="py-24 container mx-auto px-4 md:px-8 overflow-hidden">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Featured</h2>
            <p className="text-muted-foreground mt-2">Our most popular essentials.</p>
          </div>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-8">
              {products.slice(0, 4).map((product, index) => (
                <CarouselItem key={`featured-${product._id}`} className="pl-4 md:pl-8 md:basis-1/2 lg:basis-1/3">
                  <AnimatedCard delay={index * 0.1}>
                    <Link href={`/checkout?product=${product._id}`}>
                      <div className="cursor-pointer">
                        <div className="aspect-square overflow-hidden bg-secondary relative">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            data-testid={`img-featured-${product._id}`}
                          />
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg tracking-tight">
                              {product.name}
                            </h3>
                            <span className="font-medium">
                              ${product.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </AnimatedCard>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-end gap-2 mt-8">
              <CarouselPrevious className="relative inset-0 translate-y-0 h-12 w-12 border-border bg-background" />
              <CarouselNext className="relative inset-0 translate-y-0 h-12 w-12 border-border bg-background" />
            </div>
          </Carousel>
        </section>
      )}

      {/* All Products Section */}
      <section id="products" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">All Products</h2>
              <p className="text-muted-foreground mt-2">Designed to be worn, used, and loved.</p>
            </div>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-full bg-background border-none"
                data-testid="input-search-products"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                <AnimatedCard key={`all-${product._id}`} delay={index * 0.1}>
                  <Link href={`/checkout?product=${product._id}`}>
                    <div className="cursor-pointer h-full flex flex-col">
                      <div className="aspect-square overflow-hidden bg-secondary relative">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          data-testid={`img-product-${product._id}`}
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg tracking-tight" data-testid={`text-product-name-${product._id}`}>
                            {product.name}
                          </h3>
                          <span className="font-medium" data-testid={`text-product-price-${product._id}`}>
                            ${product.price}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xs text-muted-foreground">
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                          </span>
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <span className="text-lg leading-none">+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </AnimatedCard>
              ))}
            </div>
          )}
          
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-24">
              <p className="text-muted-foreground text-lg">No products found matching your search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}