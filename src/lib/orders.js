import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export const ORDERS_COLLECTION = 'orders'

/**
 * Accepts the ways people type Indian mobile numbers (+91 98765 43210,
 * 098765-43210, ...) and returns the bare 10 digits, or '' if it isn't one.
 * firestore.rules checks the same pattern, so keep the two in sync.
 */
export function normalizePhone(input) {
  const digits = String(input).replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? digits : ''
}

/**
 * Saves the cart as a lead for the admin Orders tab. Items are copied, not
 * referenced, so the order still reads correctly if a product is later
 * renamed, repriced or deleted.
 */
export function submitOrder({ name, phone, items }) {
  const lines = items.map(({ product, qty }) => ({
    productId: product.id,
    name: product.name,
    sku: product.sku || '',
    price: Number(product.price) || 0,
    qty,
  }))
  return addDoc(collection(db, ORDERS_COLLECTION), {
    name,
    phone,
    items: lines,
    totalItems: lines.reduce((sum, l) => sum + l.qty, 0),
    totalPrice: lines.reduce((sum, l) => sum + l.qty * l.price, 0),
    status: 'new',
    createdAt: serverTimestamp(),
  })
}
