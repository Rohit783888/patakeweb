import { discountPercent, formatPrice } from '../lib/format'

/** Our price, then the struck-through MRP and % off when an MRP is set. */
export default function PriceTag({ price, mrp, className = 'product-price' }) {
  const off = discountPercent(price, mrp)
  return (
    <span className="price-tag">
      <span className={className}>{formatPrice(price)}</span>
      {off > 0 && (
        <>
          <s className="price-mrp" aria-label={`MRP ${formatPrice(mrp)}`}>
            {formatPrice(mrp)}
          </s>
          <span className="price-off">({off}% off)</span>
        </>
      )}
    </span>
  )
}
