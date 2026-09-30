import { useState } from 'react'
import { useCart } from '../context/CartContext'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'INR',
})

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER

function buildWhatsAppUrl(product, qty) {
  const lineTotal = currency.format((Number(product.price) || 0) * qty)
  const lines = [
    `Hi! I'd like to order:`,
    `${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''} x${qty} — ${lineTotal}`,
    `Could you confirm availability?`,
  ]
  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}

export default function ProductCard({ product, onEdit, onDelete, adminMode = false }) {
  const outOfStock = Number(product.stock) <= 0
  const missingNumber = !WHATSAPP_NUMBER
  const [imageFailed, setImageFailed] = useState(false)
  const [qty, setQty] = useState(1)
  const coverImage = product.images?.[0] || product.imageUrl
  const hasImage = Boolean(coverImage) && !imageFailed
  const extraCount = (product.images?.length ?? 0) - 1
  const { addToCart, items } = useCart()
  const inCart = items.find((i) => i.product.id === product.id)

  function handleAdd() {
    if (outOfStock) return
    addToCart(product, qty)
    setQty(1)
  }

  function handleDirectOrder() {
    if (missingNumber || outOfStock) return
    window.open(buildWhatsAppUrl(product, qty), '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="product-card">
      {hasImage ? (
        <div className="product-image-wrap">
          <img
            src={coverImage}
            alt={product.name}
            className="product-image"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
          {extraCount > 0 && <span className="product-image-count">+{extraCount}</span>}
        </div>
      ) : (
        <div className="product-image-wrap product-image-placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Z" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m5 17 4.5-4.5a1.5 1.5 0 0 1 2 0L14 15l1.5-1.5a1.5 1.5 0 0 1 2 0L20 16" />
          </svg>
        </div>
      )}
      {product.sku && <p className="product-sku">{product.sku}</p>}
      <h3 className="product-name">{product.name}</h3>
      {product.description && <p className="product-desc">{product.description}</p>}

      <div className="product-meta-row">
        <span className="product-price">{currency.format(Number(product.price) || 0)}</span>
        <span className={`product-stock ${outOfStock ? 'out' : ''}`}>
          {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
        </span>
      </div>

      {!adminMode && (
        outOfStock ? (
          <button className="stamp-btn" disabled>
            Sold out
          </button>
        ) : (
          <>
            <div className="qty-row">
              <div className="qty-stepper">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  −
                </button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
                  +
                </button>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={handleAdd}>
                {inCart ? `In cart (${inCart.qty})` : 'Add to cart'}
              </button>
            </div>
            <button
              className="stamp-btn"
              onClick={handleDirectOrder}
              disabled={missingNumber}
              title={missingNumber ? 'Set VITE_WHATSAPP_NUMBER in .env' : undefined}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.09 3.2 5.08 4.48.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
                <path d="M12.02 2C6.5 2 2.03 6.46 2.03 11.98c0 1.87.5 3.62 1.44 5.14L2 22l5.04-1.42a9.9 9.9 0 0 0 4.98 1.34h.01c5.52 0 9.98-4.46 9.98-9.98A9.93 9.93 0 0 0 12.02 2zm0 18.2a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-2.99.84.8-2.92-.2-.3a8.2 8.2 0 1 1 6.88 3.71z" />
              </svg>
              Order this on WhatsApp
            </button>
          </>
        )
      )}

      {adminMode && (
        <div className="product-actions">
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => onEdit(product)}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => onDelete(product)}>
            Delete
          </button>
        </div>
      )}
    </article>
  )
}