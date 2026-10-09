import { useState } from 'react'
import ImageDropzone from './ImageDropzone'
import PriceTag from './PriceTag'
import { ALL_CATEGORIES } from '../lib/categories'
import { discountPercent, normalizeVideoUrl } from '../lib/format'

const emptyForm = {
  name: '',
  sku: '',
  price: '',
  mrp: '',
  stock: '',
  category: '',
  description: '',
  videoUrl: '',
  images: [],
}

export default function ProductForm({ initialProduct, onSave, onCancel }) {
  const [form, setForm] = useState(
    initialProduct
      ? {
          name: initialProduct.name ?? '',
          sku: initialProduct.sku ?? '',
          price: initialProduct.price ?? '',
          mrp: initialProduct.mrp ?? '',
          stock: initialProduct.stock ?? '',
          category: initialProduct.category ?? '',
          description: initialProduct.description ?? '',
          videoUrl: initialProduct.videoUrl ?? '',
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
    const mrpNumber = form.mrp === '' ? null : Number(form.mrp)
    if (mrpNumber !== null && (Number.isNaN(mrpNumber) || mrpNumber < priceNumber)) {
      setError('MRP should be at least our price. Leave it empty if there is no MRP.')
      return
    }
    const stockNumber = form.stock === '' ? 0 : Number(form.stock)
    if (Number.isNaN(stockNumber) || stockNumber < 0) {
      setError('Enter a valid stock quantity.')
      return
    }
    const videoUrl = normalizeVideoUrl(form.videoUrl)
    if (form.videoUrl.trim() && !videoUrl) {
      setError('The video link should be a web address, like https://youtu.be/… Leave it empty if there is no video.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: priceNumber,
        // null (not undefined) so clearing the field also clears it in Firestore.
        mrp: mrpNumber,
        stock: stockNumber,
        category: form.category,
        description: form.description.trim(),
        videoUrl,
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
              placeholder="Peacock Fountain"
              autoFocus
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="mrp">MRP (printed on box)</label>
              <input
                id="mrp"
                type="number"
                min="0"
                step="0.01"
                value={form.mrp}
                onChange={(e) => handleChange('mrp', e.target.value)}
                placeholder="500 (optional)"
              />
            </div>
            <div className="field">
              <label htmlFor="price">Our price</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="300"
              />
            </div>
          </div>
          {discountPercent(form.price, form.mrp) > 0 && (
            <p className="field-hint">
              Shoppers will see: <PriceTag price={form.price} mrp={form.mrp} />
            </p>
          )}

          <div className="field-row">
            <div className="field">
              <label htmlFor="sku">SKU</label>
              <input
                id="sku"
                type="text"
                value={form.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="PF01"
              />
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
          </div>

          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
              <option value="">Auto (guess from name)</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>
              Photos {form.images.length > 0 && `(${form.images.length})`}
            </label>
            <ImageDropzone value={form.images} onChange={(images) => handleChange('images', images)} />
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brand, pieces per box, sound, duration..."
            />
          </div>

          <div className="field">
            <label htmlFor="videoUrl">Video link (optional)</label>
            <input
              id="videoUrl"
              type="url"
              inputMode="url"
              value={form.videoUrl}
              onChange={(e) => handleChange('videoUrl', e.target.value)}
              placeholder="https://youtube.com/shorts/… or an Instagram reel link"
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
