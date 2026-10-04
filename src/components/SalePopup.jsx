import { useEffect, useRef, useState } from 'react'
import poster from '../assets/diwali-sale-poster.webp'
import { whatsAppUrl, WHATSAPP_NUMBER } from '../lib/format'
import { WhatsAppIcon } from './CartBar'

// Bump this when the poster changes so visitors who closed the old one see the new one.
const SEEN_KEY = 'sale-popup-seen:diwali-2026'

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Private mode etc.: the popup may show again next visit, which is fine.
  }
}

/**
 * Shows the sale poster once per visit, the first time the shopper scrolls
 * the product section into view.
 */
export default function SalePopup({ triggerRef }) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef(null)

  useEffect(() => {
    const target = triggerRef.current
    if (!target || alreadySeen() || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        markSeen()
        setOpen(true)
      },
      { threshold: 0.15 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [triggerRef])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open])

  if (!open) return null

  function handleWhatsApp() {
    const lines = ["Hi! I saw your Diwali Cracker Sale and I'd like to order."]
    window.open(whatsAppUrl(lines), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="sale-popup" role="dialog" aria-modal="true" aria-label="Diwali Cracker Sale">
        <button ref={closeRef} type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
          ✕
        </button>
        <img
          src={poster}
          className="sale-popup-img"
          alt="Diwali Cracker Sale: all types of fire crackers available. 5–10% extra discount on the total amount for bills over ₹5000. DM us to order."
        />
        <div className="sale-popup-actions">
          {WHATSAPP_NUMBER && (
            <button type="button" className="whatsapp-btn" onClick={handleWhatsApp}>
              <WhatsAppIcon /> DM us on WhatsApp
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
            Browse crackers
          </button>
        </div>
      </div>
    </div>
  )
}
