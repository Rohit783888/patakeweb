import { useEffect, useRef, useState } from 'react'
import { useCart } from '../context/CartContext'
import { formatPrice, orderLine, productImages, whatsAppUrl, WHATSAPP_NUMBER } from '../lib/format'
import { getCategory } from '../lib/categories'
import { sparkBurst } from '../lib/fireworks'
import { ImagePlaceholder } from './ProductCard'
import { WhatsAppIcon } from './CartBar'

export default function ProductModal({ product, onClose }) {
  const images = productImages(product)
  const [active, setActive] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const closeRef = useRef(null)
  const touchX = useRef(null)
  const { addToCart, items } = useCart()

  const stock = Number(product.stock) || 0
  const outOfStock = stock <= 0
  const category = getCategory(product)
  const inCart = items.find((i) => i.product.id === product.id)
  const hasMany = images.length > 1

  const go = (delta) => setActive((i) => (i + delta + images.length) % images.length)

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [])

  function handleAdd(e) {
    addToCart(product, qty)
    sparkBurst(e.clientX, e.clientY)
    setAdded(true)
    setQty(1)
    setTimeout(() => setAdded(false), 1600)
  }

  function handleWhatsApp() {
    const lines = [`Hi! I'd like to order:`, orderLine(product, qty), `Could you confirm availability?`]
    window.open(whatsAppUrl(lines), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="modal-overlay modal-overlay--product" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="product-modal" role="dialog" aria-modal="true" aria-label={product.name}>
        <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="gallery">
          <div
            className="gallery-stage"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current == null || !hasMany) return
              const dx = e.changedTouches[0].clientX - touchX.current
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
              touchX.current = null
            }}
          >
            {images.length ? (
              <div className="gallery-track" style={{ transform: `translateX(-${active * 100}%)` }}>
                {images.map((src, i) => (
                  <img key={src + i} src={src} alt={`${product.name} — photo ${i + 1} of ${images.length}`} />
                ))}
              </div>
            ) : (
              <ImagePlaceholder />
            )}

            {hasMany && (
              <>
                <button type="button" className="gallery-nav gallery-nav--prev" onClick={() => go(-1)} aria-label="Previous photo">
                  ‹
                </button>
                <button type="button" className="gallery-nav gallery-nav--next" onClick={() => go(1)} aria-label="Next photo">
                  ›
                </button>
                <span className="gallery-counter">
                  {active + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {hasMany && (
            <div className="gallery-thumbs">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  className={`gallery-thumb ${i === active ? 'is-active' : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === active}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-details">
          <span className="chip chip-category chip-static">
            {category.emoji} {category.label}
          </span>
          <h2 className="product-details-name">{product.name}</h2>
          {product.sku && <p className="product-details-sku">SKU · {product.sku}</p>}

          <div className="product-details-price-row">
            <span className="product-details-price">{formatPrice(product.price)}</span>
            <span className={`stock-pill ${outOfStock ? 'out' : stock <= 5 ? 'low' : ''}`}>
              {outOfStock ? 'Sold out' : stock <= 5 ? `Hurry, only ${stock} left` : 'In stock'}
            </span>
          </div>

          {product.description && <p className="product-details-desc">{product.description}</p>}

          {!outOfStock && (
            <div className="product-details-buy">
              <div className="qty-stepper qty-stepper--lg">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  −
                </button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
                  +
                </button>
              </div>
              <button type="button" className={`btn btn-primary btn-lg btn-grow ${added ? 'is-added' : ''}`} onClick={handleAdd}>
                {added ? '✓ Added to cart' : `Add to cart · ${formatPrice((Number(product.price) || 0) * qty)}`}
              </button>
            </div>
          )}

          {inCart && <p className="product-details-incart">🛒 {inCart.qty} already in your cart</p>}

          {!outOfStock && (
            <button
              type="button"
              className="whatsapp-btn"
              onClick={handleWhatsApp}
              disabled={!WHATSAPP_NUMBER}
              title={!WHATSAPP_NUMBER ? 'Set VITE_WHATSAPP_NUMBER in .env' : undefined}
            >
              <WhatsAppIcon /> Order just this on WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
