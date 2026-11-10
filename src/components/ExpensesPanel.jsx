import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { formatPrice } from '../lib/format'
import { EXPENSES_COLLECTION } from '../hooks/useExpenses'
import { isSold } from './OrdersPanel'

export const EXPENSE_CATEGORIES = ['Stock purchase', 'Transport', 'Shop & stall', 'Staff', 'Other']

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' })

// Dates are stored as "YYYY-MM-DD" so they sort as strings and don't shift with time zones.
function todayString() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function formatDay(value) {
  const [y, m, d] = String(value).split('-').map(Number)
  return y && m && d ? dateFormat.format(new Date(y, m - 1, d)) : ''
}

export default function ExpensesPanel({ orders, expenses, loading, error }) {
  const [editing, setEditing] = useState(null)

  const sold = orders.filter(isSold)
  const salesTotal = sold.reduce((sum, o) => sum + (Number(o.soldAmount) || 0), 0)
  const orderValue = sold.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0)
  const spentTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const net = salesTotal - spentTotal

  async function handleDelete(expense) {
    if (!window.confirm(`Delete "${expense.title}" (${formatPrice(expense.amount)})? This can't be undone.`)) return
    await deleteDoc(doc(db, EXPENSES_COLLECTION, expense.id))
  }

  return (
    <>
      <div className="accounts-summary">
        <div className="accounts-stat">
          <span className="accounts-stat-label">Sales from sold orders</span>
          <strong className="accounts-stat-value is-sales">{formatPrice(salesTotal)}</strong>
          <span className="accounts-stat-sub">
            {sold.length} sold order{sold.length === 1 ? '' : 's'} · order value {formatPrice(orderValue)}
          </span>
        </div>
        <div className="accounts-stat">
          <span className="accounts-stat-label">Total spent on business</span>
          <strong className="accounts-stat-value is-spent">{formatPrice(spentTotal)}</strong>
          <span className="accounts-stat-sub">
            {expenses.length} expense{expenses.length === 1 ? '' : 's'} recorded
          </span>
        </div>
        <div className={`accounts-stat is-net ${net < 0 ? 'is-loss' : 'is-profit'}`}>
          <span className="accounts-stat-label">{net < 0 ? 'Net loss' : 'Net profit'}</span>
          <strong className="accounts-stat-value">{formatPrice(Math.abs(net))}</strong>
          <span className="accounts-stat-sub">
            {formatPrice(salesTotal)} sales − {formatPrice(spentTotal)} spent
          </span>
        </div>
      </div>

      <div className="toolbar accounts-toolbar">
        <span className="count-tag">
          {loading ? 'LOADING…' : `${expenses.length} EXPENSE${expenses.length === 1 ? '' : 'S'} · ${formatPrice(spentTotal)} SPENT`}
        </span>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}>
          + Add expense
        </button>
      </div>

      {error && <div className="banner error">{error}</div>}

      {!loading && !error && expenses.length === 0 && (
        <div className="empty-state">
          <h3>No expenses yet</h3>
          <p>Add what you spend on the business, like stock bought to sell, to see your profit here.</p>
        </div>
      )}

      {expenses.length > 0 && (
        <div className="expense-list">
          {expenses.map((expense) => (
            <article key={expense.id} className="expense-row">
              <div className="expense-main">
                <p className="expense-title">{expense.title}</p>
                <p className="expense-meta">
                  <span className="expense-category">{expense.category}</span>
                  {formatDay(expense.date)}
                </p>
                {expense.note && <p className="expense-note">{expense.note}</p>}
              </div>
              <strong className="expense-amount">{formatPrice(expense.amount)}</strong>
              <div className="expense-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(expense)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(expense)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <ExpenseDialog expense={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function ExpenseDialog({ expense, onClose }) {
  const isEdit = Boolean(expense.id)
  const [title, setTitle] = useState(expense.title ?? '')
  const [amount, setAmount] = useState(expense.amount != null ? String(expense.amount) : '')
  const [category, setCategory] = useState(expense.category ?? EXPENSE_CATEGORIES[0])
  const [date, setDate] = useState(expense.date ?? todayString())
  const [note, setNote] = useState(expense.note ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saving, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    const amountNumber = Number(amount)
    if (!title.trim()) return setError('Say what the money was spent on.')
    if (amount.trim() === '' || Number.isNaN(amountNumber) || amountNumber <= 0) {
      return setError('Enter the amount spent.')
    }
    if (!date) return setError('Pick the date of the expense.')
    setError('')
    setSaving(true)
    const values = { title: title.trim(), amount: amountNumber, category, date, note: note.trim() }
    try {
      if (isEdit) {
        await updateDoc(doc(db, EXPENSES_COLLECTION, expense.id), values)
      } else {
        await addDoc(collection(db, EXPENSES_COLLECTION), { ...values, createdAt: serverTimestamp() })
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit expense' : 'Add expense'}>
        <h2 className="modal-title">{isEdit ? 'Edit expense' : 'Add expense'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="expense-title">Spent on</label>
            <input
              id="expense-title"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sivakasi stock — 40 boxes"
              autoFocus
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="expense-amount">Amount</label>
              <input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="expense-date">Date</label>
              <input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="expense-category">Category</label>
            <select id="expense-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="expense-note">Note (optional)</label>
            <textarea
              id="expense-note"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid by UPI to supplier, bill no. 2214"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : '+ Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
