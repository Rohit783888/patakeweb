// Order matters: the first match wins, so "Chakar with Crackling Anar" lands
// in Chakkar rather than Anar.
export const CATEGORIES = [
  { id: 'sky-shots', label: 'Sky Shots', emoji: '🎆', match: /shot/i },
  { id: 'rockets', label: 'Rockets', emoji: '🚀', match: /rocket/i },
  { id: 'sparklers', label: 'Sparklers', emoji: '✨', match: /fuljhadi|sparkler/i },
  { id: 'chakkar', label: 'Chakkar & Spinners', emoji: '🌀', match: /chakk?ar|helicopter|drone|butterfly/i },
  { id: 'anar', label: 'Anar & Fountains', emoji: '🌋', match: /anar|flower-?\s?pots?|fountain/i },
  { id: 'bombs', label: 'Bombs & Ladi', emoji: '💥', match: /bomb|ladi|bullet|cobra/i },
]

export const OTHER_CATEGORY = { id: 'other', label: 'More Fun', emoji: '🎇' }

const byId = Object.fromEntries([...CATEGORIES, OTHER_CATEGORY].map((c) => [c.id, c]))

/**
 * Uses the category the admin picked, otherwise guesses from the product's
 * name first and then its description.
 */
export function getCategory(product) {
  if (product.category && byId[product.category]) return byId[product.category]
  for (const field of [product.name, product.description]) {
    if (!field) continue
    const hit = CATEGORIES.find((c) => c.match.test(field))
    if (hit) return hit
  }
  return OTHER_CATEGORY
}

export const ALL_CATEGORIES = [...CATEGORIES, OTHER_CATEGORY]
