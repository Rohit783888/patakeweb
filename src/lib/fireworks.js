const COLORS = ['#ffd166', '#ff8c42', '#ff4d8d', '#7df9ff', '#b98cff', '#fff3b0', '#5cf2a0']
const GRAVITY = 0.05

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const pick = (list) => list[Math.floor(Math.random() * list.length)]

/**
 * Draws fireworks on a transparent canvas. With `auto`, it keeps launching
 * rockets on its own; otherwise it only animates bursts requested via burst().
 * `onLaunch(seconds)` fires when a rocket goes up (with its rise time) and
 * `onExplode()` when anything bursts, e.g. to play sounds.
 */
export function createFireworks(canvas, { auto = false, onLaunch, onExplode } = {}) {
  const ctx = canvas.getContext('2d')
  let width = 0
  let height = 0
  let rockets = []
  let particles = []
  let raf = 0
  let nextLaunch = 0

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    width = rect.width
    height = rect.height
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function explode(x, y, { color = pick(COLORS), count = 60, power = 3.6 } = {}) {
    onExplode?.()
    const second = Math.random() < 0.35 ? pick(COLORS) : color
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2
      const speed = power * (0.35 + Math.random() * 0.65)
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.014,
        size: 1.2 + Math.random() * 1.6,
        color: i % 2 ? color : second,
      })
    }
  }

  function launch() {
    const targetY = height * (0.12 + Math.random() * 0.35)
    const vy = -Math.sqrt(2 * GRAVITY * (height - targetY))
    rockets.push({
      x: width * (0.1 + Math.random() * 0.8),
      y: height,
      vx: (Math.random() - 0.5) * 1.4,
      vy,
      color: pick(COLORS),
    })
    // Frames until the rocket peaks, at ~60fps.
    onLaunch?.(-vy / GRAVITY / 60)
  }

  function frame(now) {
    // Fade the previous frame instead of clearing it, which leaves trails
    // while keeping the canvas transparent.
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'lighter'

    if (auto && now > nextLaunch) {
      launch()
      nextLaunch = now + 700 + Math.random() * 1100
    }

    rockets = rockets.filter((r) => {
      r.vy += GRAVITY
      r.x += r.vx
      r.y += r.vy
      ctx.fillStyle = r.color
      ctx.beginPath()
      ctx.arc(r.x, r.y, 2, 0, Math.PI * 2)
      ctx.fill()
      if (r.vy >= -0.4) {
        explode(r.x, r.y, { color: r.color })
        return false
      }
      return true
    })

    particles = particles.filter((p) => {
      p.vx *= 0.985
      p.vy = p.vy * 0.985 + GRAVITY * 0.7
      p.x += p.vx
      p.y += p.vy
      p.life -= p.decay
      if (p.life <= 0) return false
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      return true
    })
    ctx.globalAlpha = 1

    if (auto || rockets.length || particles.length) {
      raf = requestAnimationFrame(frame)
    } else {
      raf = 0
      ctx.clearRect(0, 0, width, height)
    }
  }

  function start() {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  function stop() {
    cancelAnimationFrame(raf)
    raf = 0
  }

  resize()

  return {
    start,
    stop,
    resize,
    burst(x, y, options) {
      explode(x, y, options)
      start()
    },
  }
}

let overlay = null

/** A small spark burst at a viewport point, e.g. where the user clicked. */
export function sparkBurst(x, y) {
  if (prefersReducedMotion()) return
  if (!overlay) {
    const canvas = document.createElement('canvas')
    canvas.className = 'spark-overlay'
    canvas.setAttribute('aria-hidden', 'true')
    document.body.appendChild(canvas)
    overlay = createFireworks(canvas)
    window.addEventListener('resize', () => overlay.resize())
  }
  overlay.burst(x, y, { count: 26, power: 2.6 })
}
