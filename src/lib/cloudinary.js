const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function uploadOne(file, index, onProgress) {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(
        new Error(
          'Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET in .env'
        )
      )
      return
    }

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(index, Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          onProgress(index, 100)
          resolve(data.secure_url)
        } catch {
          reject(new Error('Could not parse the Cloudinary response.'))
        }
      } else {
        let message = `Upload failed (${xhr.status}).`
        try {
          const data = JSON.parse(xhr.responseText)
          if (data?.error?.message) message = data.error.message
        } catch {
          // ignore parse failure, keep default message
        }
        reject(new Error(message))
      }
    }

    xhr.onerror = () => reject(new Error('Network error while uploading to Cloudinary.'))
    xhr.send(formData)
  })
}

/**
 * Uploads a list of image files to Cloudinary using an unsigned upload
 * preset, in parallel, reporting per-file progress.
 *
 * @param {File[]} files
 * @param {(index: number, percent: number) => void} onProgress
 * @returns {Promise<string[]>} secure_url for each uploaded image, in order
 */
export async function uploadImagesToCloudinary(files, onProgress) {
  const list = Array.from(files)
  return Promise.all(list.map((file, index) => uploadOne(file, index, onProgress)))
}
