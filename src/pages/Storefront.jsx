import { useMemo, useRef, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import CartBar from '../components/CartBar'
import Hero from '../components/Hero'
import { ALL_CATEGORIES, getCategory } from '../lib/categories'

const SORTS = {
  featured: { label: 'Featured', fn: null },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0) },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => (Number(b.price) || 0) - (Number(a.price) || 0) },
  name: { label: 'Name: A to Z', fn: (a, b) => a.name.localeCompare(b.name) },
}

export default function Storefront() {
  const { products, loading, error } = useProducts()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('featured')
  const [openId, setOpenId] = useState(null)
  const shopRef = useRef(null)
  const openProduct = openId && products.find((p) => p.id === openId)

  const withCategory = useMemo(
    () => products.map((p) => ({ product: p, category: getCategory(p) })),
    [products]
  )

  const categoryCounts = useMemo(() => {
    const counts = {}
    withCategory.forEach(({ category }) => (counts[category.id] = (counts[category.id] || 0) + 1))
    return counts
  }, [withCategory])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    let list = withCategory
      .filter(({ category: c }) => category === 'all' || c.id === category)
      .filter(
        ({ product: p }) =>
          !term || [p.name, p.description, p.sku].some((f) => f?.toLowerCase().includes(term))
      )
      .map(({ product }) => product)
    // Keep sold-out items at the end so shoppers see what they can buy first.
    const inStock = (p) => (Number(p.stock) > 0 ? 0 : 1)
    const sortFn = SORTS[sort].fn
    list = [...list].sort((a, b) => inStock(a) - inStock(b) || (sortFn ? sortFn(a, b) : 0))
    return list
  }, [withCategory, category, search, sort])

  const presentCategories = ALL_CATEGORIES.filter((c) => categoryCounts[c.id])
  const filtersActive = search.trim() || category !== 'all'

  function scrollToShop() {
    shopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function clearFilters() {
    setSearch('')
    setCategory('all')
  }

  return (
    <div className="page">
      <Hero productCount={products.length} categoryCount={presentCategories.length} onShopClick={scrollToShop} />

      <section ref={shopRef} className="shop" aria-label="Products">
        <div className="shop-bar">
          <div className="shop-bar-row">
            <label className="search">
              <span className="search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search anar, rocket, ladi…"
                aria-label="Search products"
              />
            </label>
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="category-chips" role="tablist" aria-label="Categories">
            <button
              type="button"
              role="tab"
              aria-selected={category === 'all'}
              className={`cat-chip ${category === 'all' ? 'is-active' : ''}`}
              onClick={() => setCategory('all')}
            >
              🎉 All <span className="cat-chip-count">{products.length}</span>
            </button>
            {presentCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                className={`cat-chip ${category === c.id ? 'is-active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.emoji} {c.label} <span className="cat-chip-count">{categoryCounts[c.id]}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="count-tag" aria-live="polite">
          {loading
            ? 'Loading crackers…'
            : filtersActive
              ? `${visible.length} of ${products.length} items`
              : `${products.length} item${products.length === 1 ? '' : 's'}`}
        </p>

        {error && <div className="banner error">{error}</div>}

        {loading && (
          <div className="product-grid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div className="product-card skeleton" key={i}>
                <div className="product-media" />
                <div className="product-body">
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="empty-state">
            <h3>Nothing here yet!</h3>
            <p>Check back soon — new goodies are on the way.</p>
          </div>
        )}

        {!loading && products.length > 0 && visible.length === 0 && (
          <div className="empty-state">
            <h3>No crackers match that</h3>
            <p>Try a different word or category.</p>
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}

        <div className="product-grid">
          {visible.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} onOpen={(p) => setOpenId(p.id)} />
          ))}
        </div>
      </section>

      <footer className="storefront-footer">
        <p>🪔 Celebrate safely — light crackers in open spaces, keep water nearby, and keep kids supervised.</p>
      </footer>

      <CartBar />
      {openProduct && <ProductModal product={openProduct} onClose={() => setOpenId(null)} />}
    </div>
  )
}
