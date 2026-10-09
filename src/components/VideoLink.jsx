import { normalizeVideoUrl } from '../lib/format'

/** "Watch it burn" button that opens the product's demo video in a new tab. */
export default function VideoLink({ url, className = '' }) {
  const href = normalizeVideoUrl(url)
  if (!href) return null
  return (
    <a
      className={`video-btn ${className}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // Cards open the product modal on click; the link should only open the video.
      onClick={(e) => e.stopPropagation()}
    >
      <span className="video-btn-icon" aria-hidden="true">
        ▶
      </span>
      Watch it burn
    </a>
  )
}
