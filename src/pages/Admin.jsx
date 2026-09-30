import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useProducts, PRODUCTS_COLLECTION } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'
import ProductForm from '../components/ProductForm'
import LoginForm from '../components/LoginForm'

export default function Admin() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page">
        <p className="count-tag" style={{ marginTop: '3rem' }}>
          LOADING…
        </p>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <AdminDashboard />
}

function AdminDashboard() {
  const { user, logout } = useAuth()
  const { products, loading, error } = useProducts()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  function openAddForm() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEditForm(product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingProduct(null)
  }

  async function handleSave(values) {
    if (editingProduct) {
      await updateDoc(doc(db, PRODUCTS_COLLECTION, editingProduct.id), values)
    } else {
      await addDoc(collection(db, PRODUCTS_COLLECTION), {
        ...values,
        createdAt: serverTimestamp(),
      })
    }
    closeForm()
  }

  async function handleDelete(product) {
    const sure = window.confirm(`Delete "${product.name}" from the catalog? This can't be undone.`)
    if (!sure) return
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, product.id))
  }

  return (
    <div className="page">
      <header className="ledger-header">
        <div className="ledger-header-row">
          <div>
            <p className="ledger-eyebrow">🎇 Firecrackers Hub · Admin</p>
            <h1 className="ledger-title">Manage Products</h1>
            <p className="ledger-sub">Signed in as {user.email}</p>
          </div>
          <div className="admin-header-actions">
            <Link to="/" className="btn btn-ghost">
              View storefront
            </Link>
            <button className="btn btn-ghost" onClick={logout}>
              Log out
            </button>
            <button className="btn btn-primary" onClick={openAddForm}>
              + Add product
            </button>
          </div>
        </div>
      </header>

      <div className="toolbar">
        <span className="count-tag">
          {loading ? 'LOADING…' : `${products.length} ITEM${products.length === 1 ? '' : 'S'} ON RECORD`}
        </span>
      </div>

      {error && <div className="banner error">{error}</div>}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <h3>No products yet</h3>
          <p>Click "+ Add product" to start building the catalog.</p>
        </div>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            adminMode
            onOpen={openEditForm}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {formOpen && (
        <ProductForm initialProduct={editingProduct} onSave={handleSave} onCancel={closeForm} />
      )}
    </div>
  )
}
