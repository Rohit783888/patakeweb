import { deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { formatPrice } from '../lib/format'
import { ORDERS_COLLECTION } from '../lib/orders'

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

export default function OrdersPanel({ orders, loading, error }) {
  const newCount = orders.filter((o) => o.status === 'new').length

  return (
    <>
      <div className="toolbar">
        <span className="count-tag">
          {loading ? 'LOADING…' : `${orders.length} ORDER${orders.length === 1 ? '' : 'S'} · ${newCount} NEW`}
        </span>
      </div>

      {error && <div className="banner error">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>When a shopper submits their cart at checkout, it shows up here instantly.</p>
        </div>
      )}

      <div className="order-list">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </>
  )
}

function OrderCard({ order }) {
  const isNew = order.status === 'new'
  const placedAt = order.createdAt?.toDate?.()

  function toggleStatus() {
    updateDoc(doc(db, ORDERS_COLLECTION, order.id), { status: isNew ? 'contacted' : 'new' })
  }

  function handleDelete() {
    if (!window.confirm(`Delete the order from ${order.name}? This can't be undone.`)) return
    deleteDoc(doc(db, ORDERS_COLLECTION, order.id))
  }

  return (
    <article className={`order-card ${isNew ? 'is-new' : ''}`}>
      <header className="order-head">
        <div>
          <p className="order-name">{order.name}</p>
          <a className="order-phone" href={`tel:+91${order.phone}`}>
            📞 +91 {order.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
          </a>
        </div>
        <div className="order-meta">
          <span className={`order-status ${isNew ? 'is-new' : ''}`}>{isNew ? 'New' : 'Contacted'}</span>
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
            <td>Total</td>
            <td>{order.totalItems}</td>
            <td />
            <td>{formatPrice(order.totalPrice)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="product-actions">
        <button className={`btn btn-sm ${isNew ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleStatus}>
          {isNew ? '✓ Mark contacted' : 'Mark as new'}
        </button>
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </article>
  )
}
