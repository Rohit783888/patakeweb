// Firework sound effects synthesised with the Web Audio API, so there are no
// audio files to host. Browsers only allow audio after the visitor has
// clicked, tapped or pressed a key on the page, so nothing plays before that.

const MASTER_VOLUME = 0.35

let ctx = null
let master = null
let noiseBuffer = null

function getContext() {
  if (ctx) return ctx
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  ctx = new AudioCtx()
  master = ctx.createGain()
  master.gain.value = MASTER_VOLUME
  master.connect(ctx.destination)

  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return ctx
}

export function isAudioUnlocked() {
  return ctx?.state === 'running'
}

/** Must be called from inside a click/tap/keydown handler. */
export function unlockAudio() {
  const c = getContext()
  if (!c) return Promise.resolve(false)
  return c.resume().then(() => c.state === 'running').catch(() => false)
}

function noiseSource() {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  return src
}

/** A rising whistle with a bit of hiss, for a rocket going up. */
export function playLaunch(duration = 1.1) {
  if (!isAudioUnlocked()) return
  const t = ctx.currentTime
  const pitch = 0.85 + Math.random() * 0.3

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(700 * pitch, t)
  osc.frequency.exponentialRampToValueAtTime(2100 * pitch, t + duration)
  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(0.0001, t)
  oscGain.gain.exponentialRampToValueAtTime(0.12, t + 0.08)
  oscGain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(oscGain).connect(master)

  const hiss = noiseSource()
  const hissFilter = ctx.createBiquadFilter()
  hissFilter.type = 'bandpass'
  hissFilter.frequency.value = 3000
  hissFilter.Q.value = 0.8
  const hissGain = ctx.createGain()
  hissGain.gain.setValueAtTime(0.06, t)
  hissGain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  hiss.connect(hissFilter).connect(hissGain).connect(master)

  osc.start(t)
  osc.stop(t + duration)
  hiss.start(t, Math.random())
  hiss.stop(t + duration)
}

/** A deep boom followed by a short crackle, for a burst. */
export function playBoom(size = 1) {
  if (!isAudioUnlocked()) return
  const t = ctx.currentTime

  const boom = noiseSource()
  const low = ctx.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.setValueAtTime(900, t)
  low.frequency.exponentialRampToValueAtTime(90, t + 0.9)
  const boomGain = ctx.createGain()
  boomGain.gain.setValueAtTime(0.9 * size, t)
  boomGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
  boom.connect(low).connect(boomGain).connect(master)
  boom.start(t, Math.random())
  boom.stop(t + 1.2)

  // Crackle: a handful of tiny clicks scattered just after the boom.
  const crackles = Math.round(10 * size)
  for (let i = 0; i < crackles; i++) {
    const at = t + 0.15 + Math.random() * 0.7
    const click = noiseSource()
    const high = ctx.createBiquadFilter()
    high.type = 'highpass'
    high.frequency.value = 2500
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.25 * Math.random(), at)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03)
    click.connect(high).connect(g).connect(master)
    click.start(at, Math.random())
    click.stop(at + 0.04)
  }
}
