const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatPrice(value) {
  return currency.format(Number(value) || 0)
}

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER

export function whatsAppUrl(lines) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}

export function orderLine(product, qty) {
  const sku = product.sku ? ` (SKU: ${product.sku})` : ''
  return `${product.name}${sku} x${qty} — ${formatPrice((Number(product.price) || 0) * qty)}`
}

// Products saved before multi-image support only have `imageUrl`.
export function productImages(product) {
  if (product.images?.length) return product.images
  return product.imageUrl ? [product.imageUrl] : []
}
