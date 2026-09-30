import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'
import CartBar from '../components/CartBar'
export default function Storefront() {
  const { products, loading, error } = useProducts()

  return (
    <div className="page">

<CartBar />
      <header className="ledger-header">
        <div className="ledger-header-row">

          <div>
            <p className="ledger-eyebrow">🧨 Pataka Store</p>
            <h1 className="ledger-title">Gandphad Patake 🧨🧨 </h1>
            <p className="ledger-sub">
              Crackers, fuljhadi, anaar, and all the good stuff. Tap the green button to order on WhatsApp!

              Make your full order then click on the cart button to check then send your order on whatsap
            </p>
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
          <h3>Nothing here yet!</h3>
          <p>Check back soon — new goodies are on the way.</p>
        </div>
      )}
  
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <footer className="storefront-footer">
        {/* <Link to="/admin" className="admin-link">
          Admin
        </Link> */}
      </footer>
    </div>
  )
}