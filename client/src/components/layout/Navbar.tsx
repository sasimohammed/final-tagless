import { Link, useLocation } from "wouter";
import { ThemeToggle } from "../theme-toggle";
import { ShoppingBag, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();

  // بس الـ Products في القائمة - من غير Admin
  const navItems = [
    { name: "Products", path: "/" },
  ];

  // Social media links
  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com/tagless", label: "Instagram" },
    { icon: Facebook, href: "https://facebook.com/tagless", label: "Facebook" },

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

        <div className="flex items-center gap-4">
          {/* Navigation Items */}
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <span className={`text-sm font-medium transition-colors hover:text-primary ${location === item.path ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.name}
              </span>
            </Link>
          ))}

          {/* Social Media Icons */}
          <div className="hidden md:flex items-center gap-2 border-l border-border/40 pl-4 ml-2">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </motion.a>
            ))}
          </div>

          <ThemeToggle />

          <Link href="/cart">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary/25"
              data-testid="button-cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Cart</span>
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Mobile Social Links - تظهر في الشاشات الصغيرة أسفل النافبار */}
      <div className="md:hidden flex items-center justify-center gap-4 py-2 border-t border-border/40 bg-background/80 backdrop-blur-sm">
        {socialLinks.map((social) => (
          <motion.a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
            aria-label={social.label}
          >
            <social.icon className="h-4 w-4" />
          </motion.a>
        ))}
      </div>
    </motion.header>
  );
}