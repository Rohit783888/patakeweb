import { useEffect, useRef } from 'react'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise = null
function loadScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_URL
    s.async = true
    s.onload = () => resolve(window.turnstile)
    s.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile failed to load'))
    }
    document.head.appendChild(s)
  })
  return scriptPromise
}

export const turnstileConfigured = Boolean(SITE_KEY)

/**
 * Cloudflare Turnstile bot check. Invisible for most shoppers; shows a
 * checkbox only when Cloudflare isn't sure. Calls onToken(token) when passed
 * and onToken(null) when the token expires or fails. Changing resetKey asks for
 * a fresh token (each token can be used only once).
 */
export default function Turnstile({ onToken, resetKey }) {
  const boxRef = useRef(null)
  const widgetRef = useRef(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false
    loadScript()
      .then((turnstile) => {
        if (cancelled || !boxRef.current) return
        widgetRef.current = turnstile.render(boxRef.current, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          theme: 'dark',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        })
      })
      .catch(() => onTokenRef.current(null))
    return () => {
      cancelled = true
      if (widgetRef.current != null) window.turnstile?.remove(widgetRef.current)
      widgetRef.current = null
    }
  }, [])

  useEffect(() => {
    if (resetKey && widgetRef.current != null) {
      onTokenRef.current(null)
      window.turnstile.reset(widgetRef.current)
    }
  }, [resetKey])

  return <div ref={boxRef} className="turnstile-box" />
}
