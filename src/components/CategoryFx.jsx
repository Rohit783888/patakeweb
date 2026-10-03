// Decorative, category-themed animation drawn behind a product card's text.
// Pure CSS (see "Category effects" in index.css): far lighter than GIFs and
// crisp at any size. Each part gets its own position/timing via CSS vars.

const range = (n) => Array.from({ length: n }, (_, i) => i)

const PARTS = {
  bombs: () => (
    <>
      <span className="fx-flash" />
      {range(3).map((i) => (
        <span key={i} className="fx-ring" style={{ '--d': `${i * 0.35}s` }} />
      ))}
      {range(8).map((i) => (
        <span key={`s${i}`} className="fx-debris" style={{ '--a': `${i * 45}deg` }} />
      ))}
    </>
  ),
  'sky-shots': () =>
    range(3).map((i) => (
      <span key={i} className="fx-shell" style={{ '--x': `${22 + i * 28}%`, '--d': `${i * 0.9}s`, '--h': `${70 + (i % 2) * 30}px` }}>
        <span className="fx-shell-trail" />
        <span className="fx-shell-pop" />
      </span>
    )),
  rockets: () =>
    range(3).map((i) => (
      <span key={i} className="fx-rocket" style={{ '--y': `${25 + i * 30}%`, '--d': `${i * 0.8}s` }} />
    )),
  sparklers: () =>
    range(14).map((i) => (
      <span
        key={i}
        className="fx-star"
        style={{ '--x': `${(i * 37) % 100}%`, '--y': `${(i * 53) % 100}%`, '--d': `${(i * 0.23) % 1.6}s`, '--s': `${0.6 + (i % 3) * 0.3}` }}
      />
    )),
  chakkar: () => (
    <>
      <span className="fx-wheel" />
      <span className="fx-wheel fx-wheel--small" />
    </>
  ),
  anar: () =>
    range(12).map((i) => (
      <span
        key={i}
        className="fx-spray"
        style={{ '--dx': `${(i - 5.5) * 9}px`, '--h': `${70 + (i % 4) * 18}px`, '--d': `${(i * 0.13) % 1.4}s` }}
      />
    )),
  trending: () => (
    <>
      <span className="fx-shine" />
      {range(10).map((i) => (
        <span
          key={i}
          className="fx-ember"
          style={{ '--x': `${(i * 41) % 100}%`, '--d': `${(i * 0.37) % 2.2}s`, '--sway': `${(i % 2 ? 1 : -1) * (6 + (i % 3) * 5)}px` }}
        />
      ))}
    </>
  ),
  other: () =>
    range(12).map((i) => (
      <span
        key={i}
        className="fx-confetti"
        style={{ '--x': `${(i * 29) % 100}%`, '--d': `${(i * 0.31) % 3}s`, '--r': `${(i % 2 ? 1 : -1) * 360}deg`, '--c': `var(--fx-c${i % 4})` }}
      />
    )),
}

export default function CategoryFx({ category, offset = 0 }) {
  const render = PARTS[category] ?? PARTS.other
  return (
    <div className={`fx fx--${category}`} style={{ '--o': `${-offset}s` }} aria-hidden="true">
      {render()}
    </div>
  )
}
