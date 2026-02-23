import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getProducts, Product } from "@/lib/sanity";
import { AnimatedCard } from "@/components/ui/animated-card";
import {
  Search,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Heart,
  Star,
  ShoppingBag,
  Grid3x3,
  LayoutList,
  ChevronRight,
  ImageOff,
  ChevronLeft
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

// Image Slider Component for multiple images
const ImageSlider = ({ images, title, productId }: { images: any[], title: string, productId: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [isHovered, setIsHovered] = useState(false);

  // Auto-slide every 3 seconds
  useEffect(() => {
    if (!isHovered && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isHovered, images.length]);

  const getImageUrl = (image: any): string | undefined => {
    // Handle different image structures from Sanity
    if (image?.asset?.url) {
      return image.asset.url;
    }
    if (image?.url) {
      return image.url;
    }
    // If we have a reference but no URL, construct it
    if (image?.asset?._ref) {
      const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      const dataset = import.meta.env.VITE_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
      if (projectId && dataset) {
        const ref = image.asset._ref;
        const [_, id, extension] = ref.split('-');
        return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}.${extension}`;
      }
    }
    return undefined;
  };

  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

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
      <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50">
        <ImageOff className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-xs text-muted-foreground">No image</span>
      </div>
    );
  }

  const currentImageUrl = getImageUrl(images[currentIndex]);

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image */}
      {currentImageUrl && !imageErrors[currentIndex] ? (
        <img
          src={currentImageUrl}
          alt={images[currentIndex]?.alt || `${title} - Image ${currentIndex + 1}`}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={() => handleImageError(currentIndex)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50">
          <ImageOff className="h-6 w-6 text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground">Image {currentIndex + 1} failed</span>
        </div>
      )}

      {/* Navigation Arrows - Only show on hover and if multiple images */}
      {images.length > 1 && isHovered && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-all duration-200 z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-all duration-200 z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Image Counter - Show if multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Dots Indicator - Show if multiple images */}
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
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-4 bg-white'
                  : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    getProducts().then((data) => {
      console.log("Products loaded:", data);
      setProducts(data);
      setLoading(false);
    }).catch(error => {
      console.error("Error loading products:", error);
      setLoading(false);
    });
  }, []);

  // Helper function to get images array
  const getProductImages = (product: Product): any[] => {
    if (!product.images || !Array.isArray(product.images)) {
      return [];
    }
    return product.images;
  };

  const filteredProducts = products.filter(
    (p) =>
      (p.title?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (p.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl animate-pulse delay-2000" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 bg-primary/20 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              }}
              animate={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                transition: {
                  duration: Math.random() * 20 + 10,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
            />
          ))}
        </div>

        <div className="container relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Men's Collection 2026
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Modern,
            </span>
            <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                masculine.
              </span>
              <motion.span
                className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary/30 to-transparent rounded-full"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Premium essentials for the modern man. Clean cuts, timeless designs,
            and uncompromising quality for your everyday style.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="rounded-full px-8 text-base h-12 group relative overflow-hidden"
              onClick={() => {
                document
                  .getElementById("featured")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="relative z-10 flex items-center">
                Shop Collection
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80"
                initial={{ x: "100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 text-base h-12 group border-2"
              onClick={() => {
                document
                  .getElementById("products")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore All
              <ChevronDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex justify-center gap-8 md:gap-16 mt-16"
          >
            {[
              { value: products.length, label: "Styles", icon: ShoppingBag },
              { value: "10k+", label: "Customers", icon: Heart },
              { value: "4.9", label: "Rating", icon: Star },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center justify-center gap-1">
                  <stat.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/20 flex justify-center">
            <motion.div
              className="w-1 h-2 bg-primary/50 rounded-full mt-2"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Featured Carousel Section */}
      {!loading && products.length > 0 && (
        <section
          id="featured"
          className="py-24 container mx-auto px-4 md:px-8 overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center md:text-left"
            >
              <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/20 bg-primary/5">
                <Sparkles className="h-3 w-3 mr-1 text-primary" />
                Featured Styles
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Essential wardrobe
                </span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto md:mx-0">
                Curated pieces every modern man needs in his collection
              </p>
            </motion.div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4 md:-ml-8">
                {products.slice(0, 4).map((product, index) => {
                  const images = getProductImages(product);
                  return (
                    <CarouselItem
                      key={`featured-${product._id}`}
                      className="pl-4 md:pl-8 md:basis-1/2 lg:basis-1/3"
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -10 }}
                        className="group relative"
                        onMouseEnter={() => setHoveredProduct(product._id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        <AnimatedCard delay={index * 0.1} className="overflow-hidden">
                          <Link href={`/checkout?id=${product._id}`}>
                            <div className="cursor-pointer">
                              <div className="aspect-square overflow-hidden bg-secondary relative">
                                <ImageSlider
                                  images={images}
                                  title={product.title}
                                  productId={product._id}
                                />

                                {/* Hover overlay with wishlist */}
                                <AnimatePresence>
                                  {hoveredProduct === product._id && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center"
                                    >
                                      <Button
                                        size="icon"
                                        variant="secondary"
                                        className="rounded-full h-10 w-10 hover:scale-110 transition-transform"
                                        onClick={(e) => toggleWishlist(product._id, e)}
                                      >
                                        <Heart className={`h-4 w-4 ${wishlist.includes(product._id) ? 'fill-red-500 text-red-500' : ''}`} />
                                      </Button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Stock badge */}
                                {product.stock > 0 && product.stock < 5 && (
                                  <Badge className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
                                    Only {product.stock} left
                                  </Badge>
                                )}
                              </div>

                              <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors">
                                    {product.title}
                                  </h3>
                                  <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                    ${product.price}
                                  </span>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                  {product.description}
                                </p>

                                {/* Arrow indicator */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Click to customize
                                  </span>
                                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:scale-110">
                                    <ChevronRight className="h-4 w-4" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </AnimatedCard>
                      </motion.div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              <div className="flex justify-end gap-2 mt-8">
                <CarouselPrevious className="relative inset-0 translate-y-0 h-12 w-12 rounded-full border-border bg-background/50 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300" />
                <CarouselNext className="relative inset-0 translate-y-0 h-12 w-12 rounded-full border-border bg-background/50 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300" />
              </div>
            </Carousel>
          </div>
        </section>
      )}

      {/* All Products Section */}
      <section id="products" className="py-24 bg-gradient-to-b from-secondary/30 via-background to-background">
        <div className="container mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/20">
                <ShoppingBag className="h-3 w-3 mr-1 text-primary" />
                Complete Collection
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Men's
                </span>
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent ml-2">
                  apparel
                </span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Designed for comfort, built to last, styled for the modern gentleman.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto"
            >
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search styles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 pr-4 rounded-full bg-background/50 backdrop-blur-sm border-2 focus:border-primary transition-all duration-300 w-full sm:w-72"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-lg h-10 w-10"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-lg h-10 w-10"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-32">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-muted-foreground mt-4 animate-pulse">Loading styles...</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
                  : "flex flex-col gap-4"
              }
            >
              {filteredProducts.map((product, index) => {
                const images = getProductImages(product);
                return (
                  <motion.div
                    key={`all-${product._id}`}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    className={viewMode === 'list' ? "w-full" : ""}
                    onMouseEnter={() => setHoveredProduct(product._id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    <AnimatedCard delay={index * 0.1} className="h-full overflow-hidden group">
                      <Link href={`/checkout?id=${product._id}`}>
                        <div className={`cursor-pointer h-full flex ${
                          viewMode === 'list' ? 'flex-row gap-6' : 'flex-col'
                        }`}>
                          {/* Image container */}
                          <div className={`relative overflow-hidden bg-secondary ${
                            viewMode === 'list'
                              ? 'w-48 h-48 rounded-2xl flex-shrink-0'
                              : 'aspect-square rounded-2xl'
                          }`}>
                            <ImageSlider
                              images={images}
                              title={product.title}
                              productId={product._id}
                            />

                            {/* Hover overlay */}
                            <AnimatePresence>
                              {hoveredProduct === product._id && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center gap-2"
                                >
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="rounded-full h-10 w-10 hover:scale-110 transition-transform"
                                    onClick={(e) => toggleWishlist(product._id, e)}
                                  >
                                    <Heart className={`h-4 w-4 ${wishlist.includes(product._id) ? 'fill-red-500 text-red-500' : ''}`} />
                                  </Button>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Stock indicator */}
                            {product.stock > 0 && (
                              <div className="absolute top-3 right-3">
                                <div className={`h-2 w-2 rounded-full ${
                                  product.stock > 10 ? 'bg-green-500' : 'bg-amber-500'
                                } animate-pulse`} />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className={`flex-1 ${viewMode === 'list' ? 'py-2' : 'p-5'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <h3
                                className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors"
                              >
                                {product.title}
                              </h3>
                              <span
                                className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                              >
                                ${product.price}
                              </span>
                            </div>

                            <p className={`text-sm text-muted-foreground mb-4 ${
                              viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-3'
                            }`}>
                              {product.description}
                            </p>

                            {viewMode === 'list' && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Click to customize
                                </span>
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            )}

                            {viewMode === 'grid' && (
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                                    product.stock > 0 ? 'bg-green-500' : 'bg-red-500'
                                  } mr-1`} />
                                  {product.stock > 0
                                    ? `${product.stock} in stock`
                                    : "Out of stock"}
                                </span>
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </AnimatedCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary/50 mb-6">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No styles found</h3>
              <p className="text-muted-foreground mb-6">
                We couldn't find any men's styles matching "{search}"
              </p>
              <Button
                variant="outline"
                onClick={() => setSearch("")}
                className="rounded-full"
              >
                Clear search
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Badge className="mb-6 px-4 py-1 bg-primary/10 text-primary border-0">
              Stay Updated
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Join the
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                gentlemen's club
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get exclusive access to new drops, style guides, and 10% off your first order.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-full bg-background/50 backdrop-blur-sm border-2 focus:border-primary transition-all duration-300"
              />
              <Button className="rounded-full px-8 group">
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}