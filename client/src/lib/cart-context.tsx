import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from './sanity';

export type CartItem = {
  productId: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

// Helper function to generate a unique key for cart items based on productId and options
const getItemKey = (productId: string, color?: string, size?: string) => {
  return `${productId}_${color || ''}_${size || ''}`;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1, color?: string, size?: string) => {
    setItems(prevItems => {
      // Find existing item with SAME product ID AND SAME options (color/size)
      const existingItemIndex = prevItems.findIndex(
        item =>
          item.productId === product._id &&
          item.selectedColor === color &&
          item.selectedSize === size
      );

      if (existingItemIndex >= 0) {
        // Update quantity if same product with same options exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add as new item if different options
        return [...prevItems, {
          productId: product._id,
          product,
          quantity,
          selectedColor: color,
          selectedSize: size,
        }];
      }
    });
  };

  const removeFromCart = (productId: string, color?: string, size?: string) => {
    setItems(prevItems =>
      prevItems.filter(item =>
        !(item.productId === productId &&
          item.selectedColor === color &&
          item.selectedSize === size)
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, color?: string, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId &&
        item.selectedColor === color &&
        item.selectedSize === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};