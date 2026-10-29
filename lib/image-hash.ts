/**
 * Image duplicate detection using perceptual hashing
 * This helps prevent users from uploading the same photo multiple times
 */

// Simple perceptual hash using canvas resize and pixel values
export async function generateImageHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const img = new window.Image()
        
        img.onload = () => {
          // Create a small 8x8 version of the image
          const canvas = document.createElement('canvas')
          canvas.width = 8
          canvas.height = 8
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          
          // Draw the image scaled down
          ctx.drawImage(img, 0, 0, 8, 8)
          
          // Get pixel data and convert to grayscale
          const imageData = ctx.getImageData(0, 0, 8, 8)
          const data = imageData.data
          
          let hash = ''
          let pixelSum = 0
          
          // Calculate average brightness
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const brightness = (r + g + b) / 3
            pixelSum += brightness
          }
          
          const avgBrightness = pixelSum / 64
          
          // Generate hash based on pixels above/below average
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const brightness = (r + g + b) / 3
            hash += brightness > avgBrightness ? '1' : '0'
          }
          
          resolve(hash)
        }
        
        img.onerror = () => {
          reject(new Error('Could not load image for hashing'))
        }
        
        img.src = e.target?.result as string
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Could not read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

// Calculate Hamming distance between two hashes (0 = identical, 64 = completely different)
export function calculateHashDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    return 64 // Max distance if different lengths
  }
  
  let distance = 0
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++
    }
  }
  return distance
}

// Check if an image is likely a duplicate (allow ~10% difference for compression artifacts)
export function isDuplicateImage(hash1: string, hash2: string): boolean {
  const distance = calculateHashDistance(hash1, hash2)
  return distance <= 6 // Allow max 6 bits difference out of 64
}

// Get file hash for quick duplicate checking (using SHA256 would be better but slow for large files)
export async function getFileHash(file: File): Promise<string> {
  // For quick checks, use file metadata: size + name + last modified
  const hashData = `${file.size}-${file.name}-${file.lastModified}`
  const encoder = new TextEncoder()
  const data = encoder.encode(hashData)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Exact content identity — the value stored in media.file_hash and enforced
// by the (event_id, guest_token, file_hash) unique index. Unlike the
// perceptual hash above, byte-identical files and only byte-identical files
// produce the same value, so burst shots and similar compositions never
// false-positive as duplicates.
export async function getFileContentHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}
