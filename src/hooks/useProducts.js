import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

export const PRODUCTS_COLLECTION = 'products'

// Newest first. "Move to top" in admin sets sortAt to now, so that product
// ranks as if it were just added and everything above it shifts down by one.
function rank(product) {
  return (product.sortAt ?? product.createdAt)?.toMillis?.() ?? 0
}

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // 'estimate' fills in a just-written serverTimestamp() locally so the
        // product jumps into place immediately instead of after the round-trip.
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))
        setProducts(list.sort((a, b) => rank(b) - rank(a)))
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Could not load products from Firestore.')
        setLoading(false)
      }
    )
    return unsubscribe
  }, [])

  return { products, loading, error }
}
