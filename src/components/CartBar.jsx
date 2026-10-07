import { useEffect, useRef, useState } from 'react'
import { useCart } from '../context/CartContext'
import { formatPrice, productImages } from '../lib/format'
import { normalizePhone, submitOrder } from '../lib/orders'

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.09 3.2 5.08 4.48.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
      <path d="M12.02 2C6.5 2 2.03 6.46 2.03 11.98c0 1.87.5 3.62 1.44 5.14L2 22l5.04-1.42a9.9 9.9 0 0 0 4.98 1.34h.01c5.52 0 9.98-4.46 9.98-9.98A9.93 9.93 0 0 0 12.02 2zm0 18.2a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-2.99.84.8-2.92-.2-.3a8.2 8.2 0 1 1 6.88 3.71z" />
    </svg>
  )
}

export default function CartBar() {
  const { items, updateQty, removeFromCart, clearCart, totalItems, totalPrice, isCartOpen: open, setCartOpen: setOpen } = useCart()
  const [step, setStep] = useState('cart') // 'cart' | 'checkout' | 'done'
  const [bump, setBump] = useState(false)
  const prevCount = useRef(totalItems)

  // Wiggle the cart button whenever something new goes in.
  useEffect(() => {
    if (totalItems > prevCount.current) {
      setBump(true)
      const t = setTimeout(() => setBump(false), 500)
      prevCount.current = totalItems
      return () => clearTimeout(t)
    }
    prevCount.current = totalItems
  }, [totalItems])

  useEffect(() => {
    if (items.length === 0) setOpen(false)
  }, [items.length])

  // The cart is only emptied once the shopper closes the "order received"
  // screen; emptying it straight away would unmount the drawer.
  function close() {
    setOpen(false)
    if (step === 'done') clearCart()
    setStep('cart')
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (items.length === 0) return null

  return (
    <>
      <button className={`cart-fab ${bump ? 'is-bumping' : ''}`} onClick={() => setOpen(true)}>
        <span className="cart-fab-icon" aria-hidden="true">
          🛒<span className="cart-fab-badge">{totalItems}</span>
        </span>
        <span className="cart-fab-text">
          <span className="cart-fab-label">View cart</span>
          <span className="cart-fab-total">{formatPrice(totalPrice)}</span>
        </span>
      </button>

      {open && (
        <div className="modal-overlay modal-overlay--drawer" onClick={close}>
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Your cart" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-head">
              <h2 className="modal-title">{step === 'done' ? 'Order received' : step === 'checkout' ? 'Checkout' : 'Your cart'}</h2>
              <button type="button" className="modal-close modal-close--inline" onClick={close} aria-label="Close cart">
                ✕
              </button>
            </div>

            {step === 'done' ? (
              <div className="checkout-done">
                <p className="checkout-done-icon" aria-hidden="true">
                  🎉
                </p>
                <p className="checkout-done-title">Thank you! We've got your order.</p>
                <p>Our team will call you shortly to confirm availability and delivery.</p>
                <button type="button" className="btn btn-primary" onClick={close}>
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {items.map(({ product, qty }) => {
                    const thumb = productImages(product)[0]
                    return (
                      <div className="cart-row" key={product.id}>
                        <div className="cart-row-thumb">{thumb ? <img src={thumb} alt="" /> : '🎆'}</div>
                        <div className="cart-row-info">
                          <p className="cart-row-name">{product.name}</p>
                          <p className="cart-row-price">
                            {formatPrice(product.price)} × {qty} = <strong>{formatPrice((Number(product.price) || 0) * qty)}</strong>
                          </p>
                          <div className="qty-stepper">
                            <button type="button" onClick={() => updateQty(product.id, qty - 1)} aria-label="Decrease quantity">
                              −
                            </button>
                            <span>{qty}</span>
                            <button type="button" onClick={() => updateQty(product.id, qty + 1)} aria-label="Increase quantity">
                              +
                            </button>
                          </div>
                        </div>
                        <button className="cart-row-remove" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`}>
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
    
                <div className="cart-footer">
                  <div className="cart-total-row">
                    <span>
                      Total · {totalItems} item{totalItems === 1 ? '' : 's'}
                    </span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  {step === 'checkout' ? (
                    <CheckoutForm items={items} onBack={() => setStep('cart')} onDone={() => setStep('done')} />
                  ) : (
                    <>
                      <button className="btn btn-primary checkout-btn" onClick={() => setStep('checkout')}>
                        Proceed to checkout
                      </button>
                      <button className="link-btn" onClick={clearCart}>
                        Clear cart
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

function CheckoutForm({ items, onBack, onDone }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanPhone = normalizePhone(phone)
    if (!cleanName) return setError('Please enter your name.')
    if (!cleanPhone) return setError('Please enter a valid 10-digit mobile number.')

    setError('')
    setSending(true)
    try {
      await submitOrder({ name: cleanName, phone: cleanPhone, items })
      onDone()
    } catch {
      setError("Couldn't place your order. Please check your internet and try again.")
      setSending(false)
    }
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="checkout-name">Your name</label>
        <input
          id="checkout-name"
          type="text"
          autoComplete="name"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rahul Sharma"
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="checkout-phone">Mobile number</label>
        <input
          id="checkout-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={16}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="98765 43210"
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary checkout-btn" disabled={sending}>
        {sending ? 'Placing order…' : 'Submit order'}
      </button>
      <button type="button" className="link-btn" onClick={onBack} disabled={sending}>
        ← Back to cart
      </button>
    </form>
  )
}
