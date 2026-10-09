// Vercel serverless function: POST /api/order
//
// The only way an order gets into Firestore. It checks the Cloudflare
// Turnstile token (bot check), runs the fake-lead checks, limits orders per
// phone number, and takes names/prices from the products collection rather
// than trusting what the browser sent.
//
// Needs these server-only environment variables (never prefix them VITE_):
//   TURNSTILE_SECRET_KEY      from Cloudflare Turnstile
//   FIREBASE_SERVICE_ACCOUNT  the service-account JSON from Firebase
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { checkLead, MAX_ORDERS_PER_PHONE_PER_DAY } from '../src/lib/leadChecks.js'

const MAX_LINES = 100
const MAX_QTY_PER_LINE = 500
const DAY_MS = 24 * 60 * 60 * 1000

function db() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
  }
  return getFirestore()
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

// Vercel parses JSON bodies for us; the local Vite dev server doesn't.
async function readJson(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  let raw = ''
  for await (const chunk of req) raw += chunk
  return JSON.parse(raw || '{}')
}

async function passedBotCheck(token, ip) {
  if (!token) return false
  const form = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token })
  if (ip) form.set('remoteip', ip)
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const result = await r.json()
  return result.success === true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' })
  if (!process.env.TURNSTILE_SECRET_KEY || !process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('api/order: TURNSTILE_SECRET_KEY or FIREBASE_SERVICE_ACCOUNT is not set')
    return send(res, 500, { error: 'Ordering is temporarily unavailable. Please try again later.' })
  }

  let body
  try {
    body = await readJson(req)
  } catch {
    return send(res, 400, { error: 'Invalid request.' })
  }

  // Honeypot: a field real shoppers never see. Bots that fill every input get
  // a normal-looking success so they don't learn to avoid it.
  if (body.website) return send(res, 200, { ok: true })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  if (!(await passedBotCheck(body.turnstileToken, ip))) {
    return send(res, 400, { error: 'Security check failed. Please wait a moment and try again.', retryBotCheck: true })
  }

  const lead = checkLead(body)
  if (lead.error) return send(res, 400, { error: lead.error })

  const requested = Array.isArray(body.items) ? body.items.slice(0, MAX_LINES) : []
  const wanted = requested.filter((i) => typeof i?.productId === 'string' && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= MAX_QTY_PER_LINE)
  if (wanted.length === 0) return send(res, 400, { error: 'Your cart is empty.' })

  try {
    return await saveOrder(res, lead, wanted)
  } catch (err) {
    console.error('api/order: could not save order', err)
    return send(res, 500, { error: "Couldn't place your order. Please try again in a minute." })
  }
}

async function saveOrder(res, lead, wanted) {
  const firestore = db()

  const previous = await firestore.collection('orders').where('phone', '==', lead.phone).get()
  const since = Date.now() - DAY_MS
  const recent = previous.docs.filter((d) => (d.get('createdAt')?.toMillis?.() ?? 0) > since).length
  if (recent >= MAX_ORDERS_PER_PHONE_PER_DAY) {
    return send(res, 429, { error: 'We already have your recent orders. Our team will call you shortly to confirm.' })
  }

  // Use current catalog names and prices, not the browser's copy.
  const snaps = await firestore.getAll(...wanted.map((i) => firestore.collection('products').doc(i.productId)))
  const lines = []
  snaps.forEach((snap, idx) => {
    if (!snap.exists) return
    const p = snap.data()
    lines.push({ productId: snap.id, name: p.name, sku: p.sku || '', price: Number(p.price) || 0, qty: wanted[idx].qty })
  })
  if (lines.length === 0) return send(res, 400, { error: 'These items are no longer available. Please refresh the page.' })

  await firestore.collection('orders').add({
    name: lead.name,
    phone: lead.phone,
    items: lines,
    totalItems: lines.reduce((sum, l) => sum + l.qty, 0),
    totalPrice: lines.reduce((sum, l) => sum + l.qty * l.price, 0),
    status: 'new',
    createdAt: FieldValue.serverTimestamp(),
  })

  return send(res, 200, { ok: true })
}
