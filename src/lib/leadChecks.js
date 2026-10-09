// Fake-lead checks shared by the checkout form (for instant feedback) and
// api/order.js (which enforces them). Plain JS with no imports so it runs in
// both the browser and the server function.

/**
 * Accepts the ways people type Indian mobile numbers (+91 98765 43210,
 * 098765-43210, ...) and returns the bare 10 digits, or '' if it isn't one.
 */
export function normalizePhone(input) {
  const digits = String(input).replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? digits : ''
}

// Numbers people type when they don't want to give a real one.
const PLACEHOLDER_NUMBERS = new Set(['9876543210', '9123456789', '9012345678', '8888888888', '9999999999', '7777777777', '6666666666'])
const SEQUENCES = '01234567890123456789 98765432109876543210'

function looksFakePhone(phone) {
  if (PLACEHOLDER_NUMBERS.has(phone)) return true
  // 9999999999, 9898989898, 9000000000... real numbers use 3+ different digits.
  if (new Set(phone).size < 3) return true
  // 6789012345, 9876543210 and similar runs.
  if (SEQUENCES.includes(phone)) return true
  return false
}

const JUNK_NAMES = new Set(['test', 'testing', 'tester', 'asdf', 'asd', 'abc', 'abcd', 'xyz', 'qwerty', 'fake', 'demo', 'na', 'none', 'null', 'user', 'name', 'admin', 'hello', 'hi'])

function looksFakeName(name) {
  const lower = name.toLowerCase()
  if (JUNK_NAMES.has(lower) || JUNK_NAMES.has(lower.replace(/\s+/g, ''))) return true
  // aaaa, kkkkk
  if (/^(.)\1+$/.test(lower.replace(/\s+/g, ''))) return true
  // Keyboard mashes like "sdfgh" have no vowels; real English-typed names
  // (Shyam, Priya, Krishna) do. Names in Hindi etc. skip this check.
  if (/^[a-z .']+$/.test(lower) && !/[aeiouy]/.test(lower)) return true
  return false
}

/**
 * Returns { name, phone } cleaned up, or { error } with a message to show the
 * shopper.
 */
export function checkLead({ name, phone }) {
  const cleanName = String(name ?? '').trim().replace(/\s+/g, ' ')
  // Letters in any script (so "राहुल" works), plus spaces, dots and apostrophes.
  if (cleanName.length < 2 || cleanName.length > 60 || !/^\p{L}[\p{L}\p{M} .']*$/u.test(cleanName)) {
    return { error: 'Please enter your name (letters only).' }
  }
  if (looksFakeName(cleanName)) {
    return { error: 'Please enter your real name so our team knows who to ask for.' }
  }

  const cleanPhone = normalizePhone(phone ?? '')
  if (!cleanPhone) {
    return { error: 'Please enter a valid 10-digit mobile number.' }
  }
  if (looksFakePhone(cleanPhone)) {
    return { error: "That doesn't look like a real mobile number. Please enter the number we can call you on." }
  }

  return { name: cleanName, phone: cleanPhone }
}

// How many orders one number may place in a rolling 24 hours.
export const MAX_ORDERS_PER_PHONE_PER_DAY = 3
