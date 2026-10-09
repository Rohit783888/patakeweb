import { useEffect, useState } from 'react'
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { formatPrice } from '../lib/format'
import { ORDERS_COLLECTION } from '../lib/orders'

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

// Anything not sold (new, or "contacted" from before the Sold flow) is still open.
export const isSold = (order) => order.status === 'sold'

const toMillis = (ts) => ts?.toMillis?.() ?? 0

export default function OrdersPanel({ orders, loading, error }) {
  const [view, setView] = useState('open')
  const [selling, setSelling] = useState(null)

  const open = orders.filter((o) => !isSold(o))
  const sold = orders.filter(isSold).sort((a, b) => toMillis(b.soldAt) - toMillis(a.soldAt))
  const shown = view === 'sold' ? sold : open
  const soldTotal = sold.reduce((sum, o) => sum + (Number(o.soldAmount) || 0), 0)

  return (
    <>
      <div className="category-chips order-views" role="tablist" aria-label="Order status">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'open'}
          className={`cat-chip ${view === 'open' ? 'is-active' : ''}`}
          onClick={() => setView('open')}
        >
          Open <span className="cat-chip-count">{open.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'sold'}
          className={`cat-chip ${view === 'sold' ? 'is-active' : ''}`}
          onClick={() => setView('sold')}
        >
          ✓ Sold <span className="cat-chip-count">{sold.length}</span>
        </button>
      </div>

      <div className="toolbar">
        <span className="count-tag">
          {loading
            ? 'LOADING…'
            : view === 'sold'
              ? `${sold.length} SOLD · ${formatPrice(soldTotal)} TOTAL SALES`
              : `${open.length} OPEN ORDER${open.length === 1 ? '' : 'S'}`}
        </span>
      </div>

      {error && <div className="banner error">{error}</div>}

      {!loading && !error && shown.length === 0 && (
        <div className="empty-state">
          {view === 'sold' ? (
            <>
              <h3>No sales yet</h3>
              <p>Orders you mark as Sold move here, with the final price and your remarks.</p>
            </>
          ) : (
            <>
              <h3>No open orders</h3>
              <p>When a shopper submits their cart at checkout, it shows up here instantly.</p>
            </>
          )}
        </div>
      )}

      <div className="order-list">
        {shown.map((order) => (
          <OrderCard key={order.id} order={order} onSell={() => setSelling(order)} />
        ))}
      </div>

      {selling && <SoldDialog order={selling} onClose={() => setSelling(null)} />}
    </>
  )
}

function OrderCard({ order, onSell }) {
  const sold = isSold(order)
  const placedAt = order.createdAt?.toDate?.()
  const soldAt = order.soldAt?.toDate?.()
  const soldAmount = Number(order.soldAmount) || 0
  const discount = (Number(order.totalPrice) || 0) - soldAmount

  function reopen() {
    if (!window.confirm(`Move ${order.name}'s order back to Open? The sold price and remarks are kept.`)) return
    updateDoc(doc(db, ORDERS_COLLECTION, order.id), { status: 'new' })
  }

  function handleDelete() {
    if (!window.confirm(`Delete the order from ${order.name}? This can't be undone.`)) return
    deleteDoc(doc(db, ORDERS_COLLECTION, order.id))
  }

  return (
    <article className={`order-card ${!sold && order.status === 'new' ? 'is-new' : ''} ${sold ? 'is-sold' : ''}`}>
      <header className="order-head">
        <div>
          <p className="order-name">{order.name}</p>
          <a className="order-phone" href={`tel:+91${order.phone}`}>
            📞 +91 {order.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
          </a>
        </div>
        <div className="order-meta">
          <span className={`order-status ${sold ? 'is-sold' : order.status === 'new' ? 'is-new' : ''}`}>
            {sold ? 'Sold' : order.status === 'new' ? 'New' : 'Contacted'}
          </span>
          {placedAt && <time dateTime={placedAt.toISOString()}>{dateFormat.format(placedAt)}</time>}
        </div>
      </header>

      <table className="order-items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={item.productId + i}>
              <td>
                {item.name}
                {item.sku && <span className="order-sku"> · {item.sku}</span>}
              </td>
              <td>{item.qty}</td>
              <td>{formatPrice(item.price)}</td>
              <td>{formatPrice(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Order total</td>
            <td>{order.totalItems}</td>
            <td />
            <td>{formatPrice(order.totalPrice)}</td>
          </tr>
        </tfoot>
      </table>

      {sold && (
        <div className="order-sale">
          <div className="order-sale-row">
            <span>Sold for</span>
            <strong>{formatPrice(soldAmount)}</strong>
          </div>
          {discount !== 0 && (
            <p className="order-sale-diff">
              {discount > 0 ? `${formatPrice(discount)} less than` : `${formatPrice(-discount)} more than`} the order total
            </p>
          )}
          {order.remarks && <p className="order-remarks">“{order.remarks}”</p>}
          {soldAt && <p className="order-sale-date">Sold on {dateFormat.format(soldAt)}</p>}
        </div>
      )}

      <div className="product-actions">
        {sold ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={onSell}>
              Edit sale
            </button>
            <button className="btn btn-ghost btn-sm" onClick={reopen}>
              Undo sold
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onSell}>
            ✓ Sold
          </button>
        )}
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </article>
  )
}

function SoldDialog({ order, onClose }) {
  const editing = isSold(order)
  const [amount, setAmount] = useState(String(editing ? order.soldAmount : order.totalPrice ?? ''))
  const [remarks, setRemarks] = useState(order.remarks ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saving, onClose])

  const amountNumber = Number(amount)
  const diff = (Number(order.totalPrice) || 0) - amountNumber

  async function handleSubmit(e) {
    e.preventDefault()
    if (amount.trim() === '' || Number.isNaN(amountNumber) || amountNumber < 0) {
      return setError('Enter the final amount the customer agreed to pay.')
    }
    setError('')
    setSaving(true)
    try {
      await updateDoc(doc(db, ORDERS_COLLECTION, order.id), {
        status: 'sold',
        soldAmount: amountNumber,
        remarks: remarks.trim(),
        // Keep the original sale date when only correcting the amount or remarks.
        ...(editing && order.soldAt ? {} : { soldAt: serverTimestamp() }),
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={`Mark ${order.name}'s order as sold`}>
        <h2 className="modal-title">{editing ? 'Edit sale' : 'Mark as sold'}</h2>
        <p className="sold-dialog-sub">
          {order.name} · {order.totalItems} item{order.totalItems === 1 ? '' : 's'} · order total{' '}
          <strong>{formatPrice(order.totalPrice)}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="sold-amount">Sold for (final agreed amount)</label>
            <input
              id="sold-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          {amount.trim() !== '' && !Number.isNaN(amountNumber) && diff !== 0 && (
            <p className="field-hint">
              {diff > 0 ? `${formatPrice(diff)} discount on the order total` : `${formatPrice(-diff)} above the order total`}
            </p>
          )}

          <div className="field">
            <label htmlFor="sold-remarks">Remarks (optional)</label>
            <textarea
              id="sold-remarks"
              maxLength={500}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Negotiated from ₹5,600, delivered on 20 Oct, paid by UPI"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : '✓ Mark sold'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
