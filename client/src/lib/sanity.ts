import { createClient } from '@sanity/client'

// THIS TOKEN MUST HAVE WRITE ACCESS
const SANITY_TOKEN = "skkTelfpxbimQ2qqfiDs3TS2Mii5o6j6mwTuwL0glCIGX1kqSr6kU4RqU6eQjpf4rsY6vhqKPvaVqFUdxqBfnADwF9sQfPBvHNhaoHlxHZnYhu5g0G8oomDIYgK5OFU30lvt1e9aR0fytMZ7G33s41MR3hFBVViQtUJicEddAMpaiKcBNMHY"

export const client = createClient({
  projectId: 'setou27e',
  dataset: 'production',
  apiVersion: '2026-02-21',
  useCdn: false,
  token: SANITY_TOKEN, // now has read + write access
})

// ---------- TYPES ----------
export type Product = {
  _id: string
  title: string
  slug?: { current: string }
  price: number
  stock: number
  colors?: string[]
  sizes?: string[]
  images?: Array<{
    _key?: string
    _type?: 'image'
    asset?: {
      _ref?: string
      url?: string
    }
    alt?: string
    caption?: string
  }>
  description?: string
}

export type OrderItem = {
  productId: string
  productTitle?: string
  quantity: number
  selectedColor?: string
  selectedSize?: string
  price?: number
}

export type Order = {
  _id: string
  customerName: string
  phone: string
  address: string
  items: OrderItem[]
  total: number
  status: 'Pending' | 'Shipped' | 'Done'
  _createdAt: string
}

// ---------- PRODUCTS ----------
export async function getProducts(): Promise<Product[]> {
  const query = `*[_type=="product"]{
    _id, 
    title, 
    slug, 
    price, 
    stock, 
    colors, 
    sizes, 
    images[]{
      _key,
      _type,
      asset->{
        _id,
        url
      },
      alt,
      caption
    },
    description
  }`
  const data = await client.fetch(query)
  return data.map((p: any) => ({
    _id: p._id,
    title: p.title || '',
    slug: p.slug,
    price: p.price ?? 0,
    stock: p.stock ?? 0,
    colors: p.colors || [],
    sizes: p.sizes || [],
    description: p.description || '',
    images: (p.images || []).map((img: any) => ({
      _key: img._key,
      _type: img._type,
      asset: {
        _ref: img.asset?._id,
        url: img.asset?.url
      },
      alt: img.alt || '',
      caption: img.caption || '',
    })),
  }))
}

export async function getProductById(id: string): Promise<Product | null> {
  const query = `*[_type=="product" && _id==$id][0]{
    _id, 
    title, 
    slug, 
    price, 
    stock, 
    colors, 
    sizes, 
    images[]{
      _key,
      _type,
      asset->{
        _id,
        url
      },
      alt,
      caption
    },
    description
  }`
  const p = await client.fetch(query, { id })
  if (!p) return null
  return {
    _id: p._id,
    title: p.title || '',
    slug: p.slug,
    price: p.price ?? 0,
    stock: p.stock ?? 0,
    colors: p.colors || [],
    sizes: p.sizes || [],
    description: p.description || '',
    images: (p.images || []).map((img: any) => ({
      _key: img._key,
      _type: img._type,
      asset: {
        _ref: img.asset?._id,
        url: img.asset?.url
      },
      alt: img.alt || '',
      caption: img.caption || '',
    })),
  }
}

// Upload image to Sanity and return asset reference
export async function uploadImage(file: File): Promise<{ _id: string; url: string }> {
  try {
    const asset = await client.assets.upload('image', file, {
      filename: file.name,
    });
    return {
      _id: asset._id,
      url: asset.url
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Create a new product with proper image references
export async function createProduct(data: any): Promise<Product> {
  // Format images properly for Sanity
  const formattedData = {
    _type: 'product',
    title: data.title,
    slug: data.slug,
    price: data.price,
    stock: data.stock,
    colors: data.colors || [],
    sizes: data.sizes || [],
    description: data.description || '',
    images: data.images?.map((img: any) => ({
      _key: img._key,
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: img.asset._ref,
      },
      alt: img.alt || '',
      caption: img.caption || '',
    })) || [],
  };

  const newProduct = await client.create(formattedData);
  return getProductById(newProduct._id) as Promise<Product>;
}

// Update an existing product
export async function updateProduct(productId: string, data: any): Promise<Product | null> {
  // Format images properly for Sanity
  const formattedData = {
    title: data.title,
    slug: data.slug,
    price: data.price,
    stock: data.stock,
    colors: data.colors || [],
    sizes: data.sizes || [],
    description: data.description || '',
    images: data.images?.map((img: any) => ({
      _key: img._key,
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: img.asset._ref,
      },
      alt: img.alt || '',
      caption: img.caption || '',
    })) || [],
  };

  await client.patch(productId).set(formattedData).commit();
  return getProductById(productId);
}

// Delete a product
export async function deleteProduct(productId: string): Promise<void> {
  await client.delete(productId);
}

// ---------- STOCK MANAGEMENT ----------
export async function updateProductStock(productId: string, newStock: number): Promise<Product | null> {
  try {
    await client.patch(productId).set({ stock: newStock }).commit()
    return getProductById(productId)
  } catch (error) {
    console.error('Failed to update product stock:', error)
    throw error
  }
}

export async function decreaseProductStock(productId: string, quantity: number): Promise<Product | null> {
  try {
    const product = await getProductById(productId)
    if (!product) throw new Error('Product not found')

    const newStock = Math.max(0, (product.stock || 0) - quantity)
    await client.patch(productId).set({ stock: newStock }).commit()
    return getProductById(productId)
  } catch (error) {
    console.error('Failed to decrease product stock:', error)
    throw error
  }
}

export async function increaseProductStock(productId: string, quantity: number): Promise<Product | null> {
  try {
    const product = await getProductById(productId)
    if (!product) throw new Error('Product not found')

    const newStock = (product.stock || 0) + quantity
    await client.patch(productId).set({ stock: newStock }).commit()
    return getProductById(productId)
  } catch (error) {
    console.error('Failed to increase product stock:', error)
    throw error
  }
}

export async function checkProductStock(productId: string, requestedQuantity: number): Promise<{
  available: boolean
  currentStock: number
  message: string
}> {
  try {
    const product = await getProductById(productId)
    if (!product) {
      return {
        available: false,
        currentStock: 0,
        message: 'Product not found'
      }
    }

    const currentStock = product.stock || 0
    if (currentStock >= requestedQuantity) {
      return {
        available: true,
        currentStock,
        message: 'Stock available'
      }
    } else {
      return {
        available: false,
        currentStock,
        message: `Only ${currentStock} items available`
      }
    }
  } catch (error) {
    console.error('Failed to check stock:', error)
    return {
      available: false,
      currentStock: 0,
      message: 'Error checking stock'
    }
  }
}

// ---------- ORDERS ----------
export async function getOrders(): Promise<Order[]> {
  const query = `*[_type=="order"]{
    _id, 
    customerName, 
    phone, 
    address, 
    items[]{
      productId,
      productTitle,
      quantity,
      selectedColor,
      selectedSize,
      price
    }, 
    total, 
    status, 
    _createdAt
  }`
  return await client.fetch(query)
}

export async function createOrder(order: Omit<Order, '_id' | '_createdAt'>): Promise<Order> {
  // First, check if all items have sufficient stock
  for (const item of order.items) {
    const stockCheck = await checkProductStock(item.productId, item.quantity)
    if (!stockCheck.available) {
      throw new Error(`Insufficient stock for product: ${stockCheck.message}`)
    }
  }

  // Create the order with all details
  const newOrder = await client.create({
    _type: 'order',
    ...order,
  })

  // Update stock for each item
  for (const item of order.items) {
    await decreaseProductStock(item.productId, item.quantity)
  }

  return { ...newOrder, ...order }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
  const updated = await client.patch(orderId).set({ status }).commit()
  const orders = await getOrders()
  return orders.find(o => o._id === updated._id) || null
}