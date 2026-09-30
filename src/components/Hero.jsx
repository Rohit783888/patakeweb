import { useEffect, useRef, useState } from 'react'
import { createFireworks, prefersReducedMotion } from '../lib/fireworks'
import { isAudioUnlocked, playBoom, playLaunch, unlockAudio } from '../lib/fireworkSounds'

const MUTE_KEY = 'fh-sound-muted'

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export default function Hero({ productCount, categoryCount, onShopClick }) {
  const canvasRef = useRef(null)
  const fwRef = useRef(null)
  const [reducedMotion] = useState(prefersReducedMotion)
  const [muted, setMuted] = useState(readMuted)
  const [unlocked, setUnlocked] = useState(isAudioUnlocked)

  // Sounds are triggered from the animation loop, so it reads these refs
  // rather than state.
  const hovering = useRef(false)
  const soundOn = useRef(false)
  soundOn.current = unlocked && !muted

  useEffect(() => {
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      // Storage can be blocked (private mode); the toggle still works for this visit.
    }
  }, [muted])

  // Browsers only allow audio after a click/tap/key press somewhere on the
  // page, so unlock on the first one.
  useEffect(() => {
    if (unlocked || muted || reducedMotion) return
    const unlock = (e) => {
      // The sound button handles its own press; unlocking here first would
      // make that same press read as "turn sound off".
      if (e.target.closest?.('.hero-sound')) return
      unlockAudio().then((ok) => ok && setUnlocked(true))
    }
    document.addEventListener('pointerdown', unlock)
    document.addEventListener('keydown', unlock)
    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [unlocked, muted, reducedMotion])

  useEffect(() => {
    if (reducedMotion) return
    const canvas = canvasRef.current
    const fw = createFireworks(canvas, {
      auto: true,
      onLaunch: (seconds) => hovering.current && soundOn.current && playLaunch(Math.min(seconds, 1.8)),
      onExplode: () => hovering.current && soundOn.current && playBoom(),
    })
    fwRef.current = fw
    fw.start()

    // Only animate while the hero is on screen and the tab is visible.
    let onScreen = true
    const sync = () => (onScreen && !document.hidden ? fw.start() : fw.stop())
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })
    io.observe(canvas)
    const ro = new ResizeObserver(() => fw.resize())
    ro.observe(canvas)
    document.addEventListener('visibilitychange', sync)

    return () => {
      fwRef.current = null
      fw.stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  function burstAt(e) {
    // Tapping the sky sets off an extra burst — a little easter egg.
    if (!fwRef.current || e.target.closest('button')) return
    const rect = canvasRef.current.getBoundingClientRect()
    // A tap counts as hovering, so touch screens hear their own bursts.
    hovering.current = true
    fwRef.current.burst(e.clientX - rect.left, e.clientY - rect.top)
  }

  async function toggleSound() {
    if (soundOn.current) {
      setMuted(true)
      return
    }
    setMuted(false)
    if (await unlockAudio()) {
      setUnlocked(true)
      soundOn.current = true
      hovering.current = true
      playBoom(0.6)
    }
  }

  const soundLabel = muted ? 'Sound off' : unlocked ? 'Sound on' : 'Tap for sound'

  return (
    <header
      className="hero"
      onClick={burstAt}
      onPointerEnter={() => (hovering.current = true)}
      onPointerLeave={() => (hovering.current = false)}
    >
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />

      {!reducedMotion && (
        <button
          type="button"
          className={`hero-sound ${!muted && unlocked ? 'is-on' : ''}`}
          onClick={toggleSound}
          aria-pressed={!muted && unlocked}
          title="Firework sounds play while your mouse is over this banner"
        >
          <span aria-hidden="true">{muted ? '🔇' : unlocked ? '🔊' : '🔈'}</span> {soundLabel}
        </button>
      )}
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-pills">
          <p className="hero-eyebrow">🎇 Pataka Store</p>
          <p className="hero-eyebrow hero-eyebrow--green">✨ Green Crackers 🟢</p>
        </div>
        <h1 className="hero-title">
          Firecrackers <span className="hero-title-accent">Hub</span>
        </h1>
        <p className="hero-sub">
          Crackers, fuljhadi, anaar and all the good stuff. Fill your cart, then send the whole order to us
          on WhatsApp.
        </p>

        <div className="hero-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={onShopClick}>
            Shop crackers ↓
          </button>
          {productCount > 0 && (
            <span className="hero-stat">
              <strong>{productCount}</strong> items · <strong>{categoryCount}</strong> categories
            </span>
          )}
        </div>

        <ol className="hero-steps">
          <li>
            <span>1</span>Pick your crackers
          </li>
          <li>
            <span>2</span>Add them to the cart
          </li>
          <li>
            <span>3</span>Send the order on WhatsApp
          </li>
        </ol>
      </div>
    </header>
  )
}
