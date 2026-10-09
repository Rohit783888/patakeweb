export const ORDERS_COLLECTION = 'orders'

/**
 * Sends the cart to api/order.js, which runs the bot and fake-lead checks and
 * saves the order for the admin Orders tab. Only ids and quantities are sent;
 * the server looks up names and prices itself.
 * Throws an Error whose message is safe to show the shopper.
 */
export async function submitOrder({ name, phone, items, turnstileToken, website }) {
  let res
  try {
    res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        items: items.map(({ product, qty }) => ({ productId: product.id, qty })),
        turnstileToken,
        website,
      }),
    })
  } catch {
    throw new Error("Couldn't place your order. Please check your internet and try again.")
  }
  const result = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(result.error || "Couldn't place your order. Please try again.")
    err.retryBotCheck = Boolean(result.retryBotCheck)
    throw err
  }
}
