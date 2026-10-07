import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { ORDERS_COLLECTION } from '../lib/orders'

/** Live list of checkout orders, newest first. Only readable when signed in. */
export function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snapshot) => {
        setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })))
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Could not load orders from Firestore.')
        setLoading(false)
      }
    )
  }, [])

  return { orders, loading, error }
}
