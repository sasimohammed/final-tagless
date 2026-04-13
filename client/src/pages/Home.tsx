import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { getProducts, Product } from "@/lib/sanity";
import { AnimatedCard } from "@/components/ui/animated-card";
import {
  Search,
  ArrowRight,
  Heart,
  ShoppingBag,
  Grid3x3,
  LayoutList,
  ChevronRight,
  ImageOff,
  ChevronLeft,
  Sparkles,
  CalendarDays,
  X,
  Filter,
  ChevronDown,
  Star,
  TrendingUp,
  Truck,
  RotateCcw,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// ─── Image Slider ─────────────────────────────────────────────────────────────
const ImageSlider = ({
                       images,
                       title,
                       productId,
                     }: {
  images: any[];
  title: string;
  productId: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isHovered, images.length]);

  const getImageUrl = (image: any): string | undefined => {
    if (image?.asset?.url) return image.asset.url;
    if (image?.url) return image.url;
    if (image?.asset?._ref) {
      const projectId =
          import.meta.env.VITE_SANITY_PROJECT_ID ||
          process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      const dataset =
          import.meta.env.VITE_SANITY_DATASET ||
          process.env.NEXT_PUBLIC_SANITY_DATASET;
      if (projectId && dataset) {
        const ref = image.asset._ref;
        const [_, id, extension] = ref.split("-");
        return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}.${extension}`;
      }
    }
    return undefined;
  };

  const handleImageError = (index: number) =>
      setImageErrors((prev) => ({ ...prev, [index]: true }));

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary/30 to-secondary/50">
          <ImageOff className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <span className="text-xs text-muted-foreground">No image</span>
        </div>
    );
  }

  const currentImageUrl = getImageUrl(images[currentIndex]);

  return (
      <div
          className="relative w-full h-full overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
        {currentImageUrl && !imageErrors[currentIndex] ? (
            <img
                src={currentImageUrl}
                alt={images[currentIndex]?.alt || `${title} - Image ${currentIndex + 1}`}
                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
                onError={() => handleImageError(currentIndex)}
            />
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary/30 to-secondary/50">
              <ImageOff className="h-6 w-6 text-muted-foreground/50 mb-2" />
              <span className="text-xs text-muted-foreground">
            Image {currentIndex + 1} failed
          </span>
            </div>
        )}

        {images.length > 1 && isHovered && (
            <>
              <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
        )}

        {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
        )}

        {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, idx) => (
                  <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                      className={`h-1 rounded-full transition-all duration-300 ${
                          idx === currentIndex
                              ? "w-4 bg-white"
                              : "w-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                  />
              ))}
            </div>
        )}
      </div>
  );
};

// ─── Product Card Component ─────────────────────────────────────────────────────
const ProductCard = ({
                       product,
                       images,
                       isHovered,
                       onHover,
                       onLeave,
                       onWishlist,
                       isWishlisted,
                       viewMode
                     }: {
  product: Product;
  images: any[];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onWishlist: (e: React.MouseEvent) => void;
  isWishlisted: boolean;
  viewMode: "grid" | "list";
}) => {
  return (
      <motion.div
          whileHover={{ y: -4 }}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          className="h-full"
      >
        <AnimatedCard
            delay={0}
            className="h-full overflow-hidden group rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 flex flex-col"
        >
          <Link href={`/checkout?id=${product._id}`} className="h-full flex flex-col">
            {/* Image section - fixed aspect ratio */}
            <div
                className={`relative overflow-hidden bg-gradient-to-br from-secondary/20 to-secondary/40 flex-shrink-0 ${
                    viewMode === "list" ? "w-48 h-48" : "aspect-square"
                }`}
            >
              <ImageSlider
                  images={images}
                  title={product.title}
                  productId={product._id}
              />
              <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Button
                          size="icon"
                          variant="secondary"
                          className="rounded-full h-10 w-10 hover:scale-110 transition-transform"
                          onClick={onWishlist}
                      >
                        <Heart
                            className={`h-4 w-4 ${
                                isWishlisted ? "fill-red-500 text-red-500" : ""
                            }`}
                        />
                      </Button>
                    </motion.div>
                )}
              </AnimatePresence>
              {product.stock > 0 && product.stock < 5 && (
                  <div className="absolute top-3 right-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  </div>
              )}
            </div>

            {/* Content section - flexible height but consistent */}
            <div className="flex-1 p-4 flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1 flex-1">
                    {product.title}
                  </h3>
                  <span className="font-bold text-base ml-2 shrink-0">
                  {product.price} EGP
                </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
              <span
                  className={`text-xs font-medium ${
                      product.stock > 0 ? "text-green-500" : "text-red-500"
                  }`}
              >
                {product.stock > 0
                    ? `${product.stock} in stock`
                    : "Out of stock"}
              </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                View details
                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </span>
              </div>
            </div>
          </Link>
        </AnimatedCard>
      </motion.div>
  );
};

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getProducts()
        .then((data) => {
          setProducts(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error loading products:", error);
          setLoading(false);
        });
  }, []);

  const getProductImages = (product: Product): any[] => {
    if (!product.images || !Array.isArray(product.images)) return [];
    return product.images;
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
          product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      return matchesSearch && matchesPrice;
    });

    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchQuery, sortBy, priceRange]);

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) =>
        prev.includes(productId)
            ? prev.filter((id) => id !== productId)
            : [...prev, productId]
    );
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/5">
        {/* ── Featured Collection ── */}
        <section id="featured" className="py-20 container mx-auto px-4 md:px-8">
          <motion.div
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-5 px-4 py-2 rounded-full border-primary/20 bg-primary/5">
              <Sparkles className="h-3 w-3 mr-2 text-primary"/>
              Featured Collection
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Essential Wardrobe
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Curated pieces for the modern lifestyle — where comfort meets elegance
            </p>
          </motion.div>

          {loading ? (
              <div className="flex justify-center py-24">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin"/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-primary animate-pulse"/>
                  </div>
                </div>
              </div>
          ) : (
              <Carousel opts={{align: "start", loop: true}} className="w-full">
                <CarouselContent className="-ml-4">
                  {products.slice(0, 4).map((product, index) => {
                    const images = getProductImages(product);
                    return (
                        <CarouselItem
                            key={`featured-${product._id}`}
                            className="pl-4 md:basis-1/2 lg:basis-1/3"
                        >
                          <ProductCard
                              product={product}
                              images={images}
                              isHovered={hoveredProduct === product._id}
                              onHover={() => setHoveredProduct(product._id)}
                              onLeave={() => setHoveredProduct(null)}
                              onWishlist={(e) => toggleWishlist(product._id, e)}
                              isWishlisted={wishlist.includes(product._id)}
                              viewMode="grid"
                          />
                        </CarouselItem>
                    );
                  })}
                </CarouselContent>

                <div className="flex justify-end gap-2 mt-8">
                  <CarouselPrevious
                      className="relative inset-0 translate-y-0 h-10 w-10 rounded-full hover:bg-primary hover:text-white transition-colors"/>
                  <CarouselNext
                      className="relative inset-0 translate-y-0 h-10 w-10 rounded-full hover:bg-primary hover:text-white transition-colors"/>
                </div>
              </Carousel>
          )}
        </section>

        {/* ── Features Section ── */}
        <div className="bg-secondary/30 py-12 my-8">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {icon: Truck, title: "Free Shipping", sub: "On orders over 1500 EGP"},
                {icon: RotateCcw, title: "14 Days Exchange", sub: "Hassle-free returns"},
                {icon: Shield, title: "Secure Payment", sub: "100% secure checkout"},
                {icon: Star, title: "Premium Quality", sub: "Satisfaction guaranteed"},
              ].map((feature, i) => (
                  <motion.div
                      key={i}
                      initial={{opacity: 0, y: 20}}
                      whileInView={{opacity: 1, y: 0}}
                      transition={{delay: i * 0.1}}
                      className="text-center group"
                  >
                    <div
                        className="inline-flex p-3 rounded-full bg-background/50 backdrop-blur-sm mb-3 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-primary"/>
                    </div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.sub}</p>
                  </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── All Apparel ── */}
        <section id="products" className="py-20">
          <div className="container mx-auto px-4 md:px-8">
            <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                className="text-center mb-12"
            >
              <Badge variant="outline" className="mb-5 px-4 py-2 rounded-full border-primary/20 bg-primary/5">
                <CalendarDays className="h-3 w-3 mr-2 text-primary"/>
                Complete Collection
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                All Apparel
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover our full range of premium clothing — each piece tells a story
              </p>
            </motion.div>

            {/* Search and Filters */}
            <div className="mb-8">
              {/* Search Bar */}
              <div className="relative max-w-md mx-auto mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 rounded-full h-12 bg-background/50 backdrop-blur-sm"
                />
                {searchQuery && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4"/>
                    </button>
                )}
              </div>

              {/* Results count */}
              {searchQuery && (
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    Found {filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''} for
                    "{searchQuery}"
                  </p>
              )}

              {/* Filters Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2 rounded-full"
                >
                  <Filter className="h-3.5 w-3.5"/>
                  Filters
                  <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
                </Button>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-full border border-input bg-background px-4 py-1.5 text-sm outline-none cursor-pointer hover:bg-secondary transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>

                <div className="ml-auto flex gap-2">
                  <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className="h-9 w-9 rounded-lg"
                  >
                    <LayoutList className="h-4 w-4"/>
                  </Button>
                  <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="h-9 w-9 rounded-lg"
                  >
                    <Grid3x3 className="h-4 w-4"/>
                  </Button>
                </div>
              </div>

              {/* Expanded Filters */}
              <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: "auto"}}
                        exit={{opacity: 0, height: 0}}
                        className="overflow-hidden mt-4"
                    >
                      <div className="p-4 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Price Range: {priceRange[0]} - {priceRange[1]} EGP
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="5000"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Products Grid/List */}
            {loading ? (
                <div className="flex flex-col justify-center items-center py-32">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin"/>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-primary animate-pulse"/>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4 text-sm animate-pulse">
                    Loading styles...
                  </p>
                </div>
            ) : filteredAndSortedProducts.length === 0 ? (
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    className="text-center py-24"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/50 mb-6">
                    <Search className="h-8 w-8 text-muted-foreground"/>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find anything matching your criteria
                  </p>
                  <Button variant="outline" onClick={clearSearch} className="rounded-full">
                    Clear all filters
                  </Button>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={
                      viewMode === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr"
                          : "flex flex-col gap-4"
                    }
                >
                  {filteredAndSortedProducts.map((product, index) => {
                    const images = getProductImages(product);
                    return (
                        <motion.div
                            key={`all-${product._id}`}
                            variants={itemVariants}
                            className="h-full"
                        >
                          <ProductCard
                              product={product}
                              images={images}
                              isHovered={hoveredProduct === product._id}
                              onHover={() => setHoveredProduct(product._id)}
                              onLeave={() => setHoveredProduct(null)}
                              onWishlist={(e) => toggleWishlist(product._id, e)}
                              isWishlisted={wishlist.includes(product._id)}
                              viewMode={viewMode}
                          />
                        </motion.div>
                    );
                  })}
                </motion.div>
            )}
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto text-center">
              <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground mb-5">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9"/>
                </svg>
                Stay Connected
              </div>

              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Join the Taglesss Circle
              </h2>

              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Be the first to know about new collections and get exclusive access
                <br/>
                to limited drops. Plus, enjoy 10% off your first order.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                    type="email"
                    placeholder="Enter your email address"
                    className="flex-1 rounded-full h-11 px-5 bg-background border border-border/60 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button
                    className="rounded-full px-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors">
                  Subscribe
                </button>
              </div>

              <p className="text-xs text-muted-foreground/70 mt-5">
                By subscribing, you agree to our Privacy Policy and Terms of Service.
              </p>
            </div>
          </div>
        </section>
      </div>
  );
}