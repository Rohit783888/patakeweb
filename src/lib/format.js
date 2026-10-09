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

/**
 * Cleans up a pasted video link ("youtu.be/abc" works too) and returns a full
 * https URL, or '' if it isn't a web link. Only http(s) is allowed so a saved
 * link can't run script when a shopper clicks it.
 */
export function normalizeVideoUrl(input) {
  const raw = String(input ?? '').trim()
  if (!raw) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.') ? url.href : ''
  } catch {
    return ''
  }
}

// Products saved before multi-image support only have `imageUrl`.
export function productImages(product) {
  if (product.images?.length) return product.images
  return product.imageUrl ? [product.imageUrl] : []
}
