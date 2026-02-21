// Mock Sanity CMS service
// In a real application, you would install @sanity/client and configure it here.
// e.g., 
// import { createClient } from '@sanity/client'
// export const client = createClient({
//   projectId: 'YOUR_PROJECT_ID',
//   dataset: 'production',
//   useCdn: true, 
//   apiVersion: '2023-05-03',
// })

import tshirtImg from '../assets/images/product-tshirt.png';
import hoodieImg from '../assets/images/product-hoodie.png';
import toteImg from '../assets/images/product-tote.png';
import sneakersImg from '../assets/images/product-sneakers.png';

export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  stock: number;
}

export interface Order {
  _id: string;
  customerName: string;
  phone: string;
  address: string;
  items: { productId: string; quantity: number }[];
  total: number;
  status: 'Pending' | 'Shipped' | 'Done';
  createdAt: string;
}

// Initial mock products
let mockProducts: Product[] = [
  {
    _id: 'p_1',
    name: 'Essential Tee',
    price: 35,
    description: 'A perfectly weighted, minimalist white t-shirt crafted from premium organic cotton for everyday wear.',
    image: tshirtImg,
    stock: 120,
  },
  {
    _id: 'p_2',
    name: 'Heavyweight Hoodie',
    price: 85,
    description: 'Clean, logo-free black hoodie with a relaxed fit. Made with brushed fleece for ultimate comfort.',
    image: hoodieImg,
    stock: 45,
  },
  {
    _id: 'p_3',
    name: 'Canvas Utility Tote',
    price: 40,
    description: 'Durable, off-white canvas tote bag with reinforced handles. Simple, spacious, and practical.',
    image: toteImg,
    stock: 80,
  },
  {
    _id: 'p_4',
    name: 'Classic Trainers',
    price: 120,
    description: 'Sleek white leather sneakers with a minimal profile. Designed for versatility and all-day comfort.',
    image: sneakersImg,
    stock: 30,
  }
];

// Initial mock orders
let mockOrders: Order[] = [
  {
    _id: 'o_1',
    customerName: 'Alex Johnson',
    phone: '555-0192',
    address: '123 Minimalist Ave, NY 10001',
    items: [{ productId: 'p_1', quantity: 2 }, { productId: 'p_3', quantity: 1 }],
    total: 110,
    status: 'Shipped',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

// --- Mock API Methods ---

export const getProducts = async (): Promise<Product[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockProducts];
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockProducts.find(p => p._id === id);
};

export const createOrder = async (orderData: Omit<Order, '_id' | 'createdAt' | 'status'>): Promise<Order> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const newOrder: Order = {
    ...orderData,
    _id: `o_${Date.now()}`,
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };
  mockOrders = [newOrder, ...mockOrders];
  return newOrder;
};

export const getOrders = async (): Promise<Order[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockOrders];
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<Order | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const orderIndex = mockOrders.findIndex(o => o._id === orderId);
  if (orderIndex === -1) return undefined;
  
  mockOrders[orderIndex].status = status;
  return mockOrders[orderIndex];
};

export const addProduct = async (productData: Omit<Product, '_id'>): Promise<Product> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newProduct: Product = {
    ...productData,
    _id: `p_${Date.now()}`,
  };
  mockProducts = [newProduct, ...mockProducts];
  return newProduct;
};

export const updateProduct = async (productId: string, productData: Partial<Omit<Product, '_id'>>): Promise<Product | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const productIndex = mockProducts.findIndex(p => p._id === productId);
  if (productIndex === -1) return undefined;
  
  mockProducts[productIndex] = { ...mockProducts[productIndex], ...productData };
  return mockProducts[productIndex];
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const initialLength = mockProducts.length;
  mockProducts = mockProducts.filter(p => p._id !== productId);
  return mockProducts.length < initialLength;
};