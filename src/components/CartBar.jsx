import { useState } from 'react'
import { useCart } from '../context/CartContext'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'INR',
})

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER

function buildWhatsAppMessage(items, totalPrice) {
  const lines = [`Hi! I'd like to order:`, '']
  items.forEach(({ product, qty }) => {
    const lineTotal = currency.format((Number(product.price) || 0) * qty)
    lines.push(`• ${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''} x${qty} — ${lineTotal}`)
  })
  lines.push('', `Total: ${currency.format(totalPrice)}`, '', 'Could you confirm availability?')
  return lines.join('\n')
}

export default function CartBar() {
  const { items, updateQty, removeFromCart, clearCart, totalItems, totalPrice } = useCart()
  const [open, setOpen] = useState(false)
  const missingNumber = !WHATSAPP_NUMBER

  if (items.length === 0) return null

  function handleOrder() {
    if (missingNumber) return
    const text = encodeURIComponent(buildWhatsAppMessage(items, totalPrice))
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <button className="cart-fab" onClick={() => setOpen(true)}>
        ORDER NOW ON WHATSAPP
        🛒 {totalItems} item{totalItems === 1 ? '' : 's'} · {currency.format(totalPrice)}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-card cart-drawer" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Your order</h2>

            <div className="cart-list">
              {items.map(({ product, qty }) => (
                <div className="cart-row" key={product.id}>
                  <div className="cart-row-info">
                    <p className="cart-row-name">{product.name}</p>
                    <p className="cart-row-price">{currency.format(Number(product.price) || 0)} each</p>
                  </div>
                  <div className="qty-stepper">
                    <button type="button" onClick={() => updateQty(product.id, qty - 1)} aria-label="Decrease quantity">
                      −
                    </button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => updateQty(product.id, qty + 1)} aria-label="Increase quantity">
                      +
                    </button>
                  </div>
                  <button className="cart-row-remove" onClick={() => removeFromCart(product.id)} aria-label="Remove item">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-total-row">
              <span>Total</span>
              <span>{currency.format(totalPrice)}</span>
            </div>

            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={clearCart}>
                Clear cart
              </button>
              <button
                className="stamp-btn"
                style={{ width: 'auto', padding: '0.6rem 1.2rem' }}
                onClick={handleOrder}
                disabled={missingNumber}
                title={missingNumber ? 'Set VITE_WHATSAPP_NUMBER in .env' : undefined}
              >
                Order on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}