import { useEffect, useRef, useState } from 'react'
import { useCart } from '../context/CartContext'
import { formatPrice, productImages } from '../lib/format'
import { getCategory } from '../lib/categories'
import { sparkBurst } from '../lib/fireworks'
import CategoryFx from './CategoryFx'

const LOW_STOCK = 5

// One observer for all cards: toggles .is-visible so background effects
// only animate while the card is on screen.
let visibilityObserver = null
function observeVisibility(el) {
  if (typeof IntersectionObserver === 'undefined') {
    el.classList.add('is-visible')
    return () => {}
  }
  visibilityObserver ??= new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-visible', e.isIntersecting)),
    { rootMargin: '100px' }
  )
  visibilityObserver.observe(el)
  return () => visibilityObserver.unobserve(el)
}

export function ImagePlaceholder() {
  return (
    <div className="product-image-placeholder" aria-hidden="true">
      <span>🎆</span>
    </div>
  )
}

export default function ProductCard({ product, onOpen, onEdit, onDelete, adminMode = false, index = 0 }) {
  const [imageFailed, setImageFailed] = useState(false)
  const cardRef = useRef(null)
  const { addToCart, updateQty, items } = useCart()

  useEffect(() => observeVisibility(cardRef.current), [])

  const images = productImages(product)
  const cover = images[0]
  const stock = Number(product.stock) || 0
  const outOfStock = stock <= 0
  const lowStock = !outOfStock && stock <= LOW_STOCK
  const category = getCategory(product)
  const inCart = items.find((i) => i.product.id === product.id)

  function handleAdd(e) {
    e.stopPropagation()
    if (outOfStock) return
    addToCart(product, 1)
    sparkBurst(e.clientX, e.clientY)
  }

  function changeQty(e, qty) {
    e.stopPropagation()
    updateQty(product.id, qty)
  }

  return (
    <article
      ref={cardRef}
      className={`product-card ${outOfStock ? 'is-sold-out' : ''}`}
      style={{ '--i': index % 12 }}
      onClick={() => onOpen?.(product)}
    >
      <button
        type="button"
        className="product-media"
        onClick={(e) => {
          e.stopPropagation()
          onOpen?.(product)
        }}
        aria-label={`View photos and details of ${product.name}`}
      >
        {cover && !imageFailed ? (
          <img
            src={cover}
            alt=""
            className="product-image"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ImagePlaceholder />
        )}

        <span className="chip chip-category">
          {category.emoji} {category.label}
        </span>
        {images.length > 1 && (
          <span className="chip chip-photos" title={`${images.length} photos`}>
            <CameraIcon /> {images.length}
          </span>
        )}
        {outOfStock && <span className="chip chip-soldout">Sold out</span>}
        {lowStock && <span className="chip chip-low">🔥 Only {stock} left</span>}
        {!adminMode && <span className="product-media-hint">Tap to view</span>}
      </button>

      <div className="product-body">
        {/* Offset desyncs neighbouring cards so they don't all pulse together. */}
        <CategoryFx category={category.id} offset={(index * 0.73) % 3} />
        <h3 className="product-name">{product.name}</h3>
        {product.description && <p className="product-desc">{product.description}</p>}

        <div className="product-footer">
          <div className="product-price-wrap">
            <span className="product-price">{formatPrice(product.price)}</span>
            {adminMode && <span className="product-stock">{stock} in stock</span>}
          </div>

          {!adminMode &&
            (outOfStock ? null : inCart ? (
              <div className="qty-stepper qty-stepper--card" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={(e) => changeQty(e, inCart.qty - 1)} aria-label="Decrease quantity">
                  −
                </button>
                <span aria-live="polite">{inCart.qty}</span>
                <button type="button" onClick={(e) => changeQty(e, inCart.qty + 1)} aria-label="Increase quantity">
                  +
                </button>
              </div>
            ) : (
              <button type="button" className="add-btn" onClick={handleAdd}>
                <span aria-hidden="true">+</span> Add
              </button>
            ))}
        </div>

        {adminMode && (
          <div className="product-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(product)
              }}
            >
              Edit
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(product)
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}
