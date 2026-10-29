import JSZip from 'jszip'
import type { MediaItem } from './types'

export async function createZipFromMedia(
  media: MediaItem[],
  filename: string = 'wedding-photos.zip',
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip()
  const total = media.length

  for (let i = 0; i < media.length; i++) {
    const item = media[i]
    try {
      const response = await fetch(item.file_url)
      const blob = await response.blob()

      // Create a folder structure by guest name
      const ext = item.media_type === 'video' ? 'mp4' : 'jpg'
      const folderName = item.uploaded_by.replace(/\s+/g, '_')
      const fileName = `${item.id}.${ext}`

      zip.folder(folderName)?.file(fileName, blob)

      onProgress?.(i + 1, total)
    } catch (error) {
      console.error(`Failed to fetch ${item.id}:`, error)
      onProgress?.(i + 1, total)
      // Continue with next file
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  return blob
}

export function downloadZip(blob: Blob, filename: string = 'wedding-photos.zip') {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function createGuestZip(
  media: MediaItem[],
  guestName: string,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip()
  const total = media.length
  const cleanName = guestName.replace(/\s+/g, '_')

  for (let i = 0; i < media.length; i++) {
    const item = media[i]
    try {
      const response = await fetch(item.file_url)
      const blob = await response.blob()

      const ext = item.media_type === 'video' ? 'mp4' : 'jpg'
      const fileName = `${item.id}.${ext}`
      zip.file(fileName, blob)

      onProgress?.(i + 1, total)
    } catch (error) {
      console.error(`Failed to fetch ${item.id}:`, error)
      onProgress?.(i + 1, total)
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  return blob
}
