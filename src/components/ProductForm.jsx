import { useState } from 'react'
import ImageDropzone from './ImageDropzone'

const emptyForm = {
  name: '',
  sku: '',
  price: '',
  stock: '',
  description: '',
  images: [],
}

export default function ProductForm({ initialProduct, onSave, onCancel }) {
  const [form, setForm] = useState(
    initialProduct
      ? {
          name: initialProduct.name ?? '',
          sku: initialProduct.sku ?? '',
          price: initialProduct.price ?? '',
          stock: initialProduct.stock ?? '',
          description: initialProduct.description ?? '',
          images:
            initialProduct.images ?? (initialProduct.imageUrl ? [initialProduct.imageUrl] : []),
        }
      : emptyForm
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(initialProduct)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Give the product a name.')
      return
    }
    const priceNumber = Number(form.price)
    if (form.price === '' || Number.isNaN(priceNumber) || priceNumber < 0) {
      setError('Enter a valid price.')
      return
    }
    const stockNumber = form.stock === '' ? 0 : Number(form.stock)
    if (Number.isNaN(stockNumber) || stockNumber < 0) {
      setError('Enter a valid stock quantity.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: priceNumber,
        stock: stockNumber,
        description: form.description.trim(),
        images: form.images,
      })
    } catch (err) {
      setError(err.message || 'Something went wrong while saving.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={isEditing ? 'Edit product' : 'Add product'}>
        <h2 className="modal-title">{isEditing ? 'Edit product' : 'Add a new product'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Product name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Sparkly Unicorn Notebook"
              autoFocus
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="sku">SKU</label>
              <input
                id="sku"
                type="text"
                value={form.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="NOTE-014"
              />
            </div>
            <div className="field">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="12.50"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="stock">Stock on hand</label>
            <input
              id="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              placeholder="20"
            />
          </div>

          <div className="field">
            <label htmlFor="imageUpload">Photos</label>
            <ImageDropzone value={form.images} onChange={(images) => handleChange('images', images)} />
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Short note about size, colors, age range, what's included..."
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add to catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
