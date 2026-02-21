import { Link, useLocation } from "wouter";
import { ThemeToggle } from "../theme-toggle";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { name: "Products", path: "/" },
    { name: "Admin", path: "/admin" },
  ];

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">TAGLESS</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <span className={`text-sm font-medium transition-colors hover:text-primary ${location === item.path ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/checkout">
            <button className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-transform hover:scale-105 active:scale-95" data-testid="button-cart">
              <ShoppingBag className="h-4 w-4" />
              <span>Cart</span>
            </button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}