import { useCallback, useRef, useState } from 'react'
import { uploadImagesToCloudinary } from '../lib/cloudinary'

/**
 * Drag-and-drop (or click-to-browse) multi-image uploader.
 *
 * Props:
 *  - value: string[]  -> current list of image URLs
 *  - onChange: (urls: string[]) => void
 */
export default function ImageDropzone({ value = [], onChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progressList, setProgressList] = useState([])
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
      if (files.length === 0) return

      setError('')
      setUploading(true)
      setProgressList(files.map(() => 0))

      try {
        const urls = await uploadImagesToCloudinary(files, (index, pct) => {
          setProgressList((prev) => {
            const next = [...prev]
            next[index] = pct
            return next
          })
        })
        onChange([...value, ...urls])
      } catch (err) {
        setError(err.message || 'Upload failed. Check your Cloudinary preset.')
      } finally {
        setUploading(false)
        setProgressList([])
      }
    },
    [value, onChange]
  )

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  const removeAt = (idx) => {
    const next = value.filter((_, i) => i !== idx)
    onChange(next)
  }

  const moveTo = (from, to) => {
    if (to < 0 || to >= value.length) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="dropzone-wrap">
      <div
        className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        {uploading ? (
          <div className="dropzone__status">
            <p>Uploading {progressList.length} image{progressList.length > 1 ? 's' : ''}…</p>
            <div className="dropzone__bars">
              {progressList.map((pct, i) => (
                <div key={i} className="dropzone__bar">
                  <div className="dropzone__bar-fill" style={{ width: `${pct}%` }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>
            <strong>{value.length ? '+ Add more photos' : 'Drag & drop photos here'}</strong>
            <br />
            or click to browse — you can pick several at once.
            <br />
            The first photo is the cover; shoppers see all of them when they open the product.
          </p>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}

      {value.length > 0 && (
        <div className="image-grid">
          {value.map((url, idx) => (
            <div className="image-tile" key={url + idx}>
              <img src={url} alt={`Image ${idx + 1}`} />
              {idx === 0 && <span className="image-tile__cover">Cover</span>}
              <div className="image-tile__actions">
                <button type="button" onClick={() => moveTo(idx, idx - 1)} disabled={idx === 0} title="Move left">
                  ←
                </button>
                <button type="button" onClick={() => removeAt(idx)} title="Remove" className="image-tile__remove">
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => moveTo(idx, idx + 1)}
                  disabled={idx === value.length - 1}
                  title="Move right"
                >
                  →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
