// Ids are stored on products in the database, so keep them stable even when
// a label changes. Array order is the order shown in the filter chips and the
// admin dropdown.
export const OTHER_CATEGORY = { id: 'other', label: 'Kidz-Fun', emoji: '🧸' }

export const ALL_CATEGORIES = [
  { id: 'sky-shots', label: 'Sky Shots', emoji: '🎆', match: /shot/i },
  { id: 'bombs', label: 'Bombs', emoji: '💥', match: /bomb|ladi|bullet|cobra/i },
  { id: 'chakkar', label: 'Chakkari/Spinners', emoji: '🌀', match: /chakk?ar|helicopter|drone|butterfly/i },
  { id: 'sparklers', label: 'Fuljhadi', emoji: '✨', match: /fuljhadi|sparkler/i },
  { id: 'rockets', label: 'Rockets', emoji: '🚀', match: /rocket/i },
  { id: 'anar', label: 'Anar/Fountains', emoji: '🌋', match: /anar|flower-?\s?pots?|fountain/i },
  OTHER_CATEGORY,
  // Admin-picked only: there's no keyword that makes a product "trending".
  { id: 'trending', label: 'Trending Ones', emoji: '🔥' },
]

const byId = Object.fromEntries(ALL_CATEGORIES.map((c) => [c.id, c]))

// Order matters when guessing: the first match wins, so "Chakar with
// Crackling Anar" lands in Chakkari rather than Anar.
const MATCH_ORDER = ['sky-shots', 'rockets', 'sparklers', 'chakkar', 'anar', 'bombs'].map((id) => byId[id])

/**
 * Uses the category the admin picked, otherwise guesses from the product's
 * name first and then its description.
 */
export function getCategory(product) {
  if (product.category && byId[product.category]) return byId[product.category]
  for (const field of [product.name, product.description]) {
    if (!field) continue
    const hit = MATCH_ORDER.find((c) => c.match.test(field))
    if (hit) return hit
  }
  return OTHER_CATEGORY
}
