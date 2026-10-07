const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatPrice(value) {
  return currency.format(Number(value) || 0)
}

/** Whole-number % off MRP, or 0 when there's no MRP above our price. */
export function discountPercent(price, mrp) {
  if (price === '' || price == null) return 0
  const p = Number(price)
  const m = Number(mrp)
  if (!(m > 0) || !(p >= 0) || p >= m) return 0
  return Math.round(((m - p) / m) * 100)
}

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER

export function whatsAppUrl(lines) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}

// Products saved before multi-image support only have `imageUrl`.
export function productImages(product) {
  if (product.images?.length) return product.images
  return product.imageUrl ? [product.imageUrl] : []
}
