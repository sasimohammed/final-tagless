import { Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
      <footer className="border-t border-border/40 bg-background">
        <div className="container mx-auto py-12 px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Brand + tagline */}
            <div>
            <span className="text-xl font-bold tracking-widest mb-4 block">
              TAGLESS
            </span>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Super modern, clean, and minimalistic products for your everyday
                life. We believe in simplicity and quality over logos.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h3 className="font-semibold mb-4 text-sm">Shop</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    All Products
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    New Arrivals
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Best Sellers
                  </a>
                </li>
              </ul>
            </div>

            {/* Follow Us — Instagram + Facebook only (matches screenshot) */}
            <div>
              <h3 className="font-semibold mb-4 text-sm">Follow Us</h3>
              <div className="flex items-center gap-4">
                <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-instagram"
                    aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-facebook"
                    aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Tagless. All rights reserved.</p>
          </div>
        </div>
      </footer>
  );
}