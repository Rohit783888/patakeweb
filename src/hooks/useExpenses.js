import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

export const EXPENSES_COLLECTION = 'expenses'

/** Live list of business expenses, latest spend date first. Admin-only. */
export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = query(collection(db, EXPENSES_COLLECTION), orderBy('date', 'desc'))
    return onSnapshot(
      q,
      (snapshot) => {
        setExpenses(snapshot.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })))
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Could not load expenses from Firestore.')
        setLoading(false)
      }
    )
  }, [])

  return { expenses, loading, error }
}
