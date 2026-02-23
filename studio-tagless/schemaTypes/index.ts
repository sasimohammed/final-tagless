// schemas/index.ts
import product from './product'
import order from './order'  // ← استورد سكيمة الـ Order

export const schemaTypes = [
  product,
  order,
]