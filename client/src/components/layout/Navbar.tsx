import { Link, useLocation } from "wouter";
import { ThemeToggle } from "../theme-toggle";
import { ShoppingBag, Instagram, Facebook, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

// WhatsApp SVG icon (not in lucide)
const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

// Define the type for social links
type SocialLink =
    | { icon: LucideIcon; href: string; label: string; isWhatsApp?: false }
    | { icon?: never; href: string; label: string; isWhatsApp: true };

export function Navbar() {
  const [location] = useLocation();
  const [bannerOpen, setBannerOpen] = useState(true);

  const socialLinks: SocialLink[] = [
    {
      icon: Instagram,
      href: "https://www.instagram.com/tagless.eg",
      label: "Instagram",
      isWhatsApp: false
    },
    {
      icon: Facebook,
      href: "https://www.facebook.com/profile.php?id=61583346328206",
      label: "Facebook",
      isWhatsApp: false
    },
    {
      href: "https://wa.me/201141598663",
      label: "WhatsApp",
      isWhatsApp: true
    },
  ];

  return (
      <>
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md"
        >
          {/* ── Main nav ── */}
          <div className="border-b border-border/40">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">

              {/* Left: brand */}
              <Link href="/">
                <span className="text-xl font-bold tracking-widest cursor-pointer">TAGLESS</span>
              </Link>

              {/* Right: nav + socials + theme + cart */}
              <div className="flex items-center gap-1 md:gap-2">
                <Link href="/">
                  <span className={`text-sm font-medium mr-2 transition-colors hover:text-primary cursor-pointer ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
                    Products
                  </span>
                </Link>

                {/* Social icons */}
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
                      {social.isWhatsApp ? (
                          <WhatsAppIcon />
                      ) : (
                          <social.icon className="h-4 w-4" />
                      )}
                    </motion.a>
                ))}

                <ThemeToggle />

                <Link href="/cart">
                  <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium transition-all hover:bg-secondary ml-1"
                      data-testid="button-cart"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Cart</span>
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>

          {/* ── Express Delivery banner ── */}
          {bannerOpen && (
              <div className="flex items-center justify-center gap-2 bg-background border-b border-border/40 py-2.5 px-4 text-xs text-muted-foreground relative">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Express Delivery • 48-72 hours</span>
                <button
                    onClick={() => setBannerOpen(false)}
                    className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors text-base leading-none"
                    aria-label="Close banner"
                >
                  ×
                </button>
              </div>
          )}
        </motion.header>
      </>
  );
}