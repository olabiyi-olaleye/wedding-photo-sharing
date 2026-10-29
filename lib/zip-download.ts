// All ZIP generation now happens server-side via /api/admin/download-zip.
// These helpers are thin wrappers that trigger a browser download from that route.

export function downloadAllZip(): void {
  const a = document.createElement("a")
  a.href = "/api/admin/download-zip"
  a.download = ""
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function downloadUploaderZip(uploaderName: string): void {
  const a = document.createElement("a")
  a.href = `/api/admin/download-zip?uploader=${encodeURIComponent(uploaderName)}`
  a.download = ""
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// Guest-side download: fetches only the guest's own photos via the same server route.
// Guests don't have the admin cookie so this uses the public URL approach:
// fetch each URL individually and build a client-side ZIP (limited scope — only
// the guest's own photos, typically <50, well within browser memory limits).
import JSZip from "jszip"
import type { MediaItem } from "@/lib/types"

export async function downloadGuestZip(items: MediaItem[], guestName: string): Promise<void> {
  const zip = new JSZip()
  let count = 0

  for (const item of items) {
    try {
      const res = await fetch(item.file_url)
      if (!res.ok) continue
      const blob = await res.blob()
      const ext = item.media_type === "video" ? "mp4" : "jpg"
      zip.file(`${count + 1}.${ext}`, blob)
      count++
    } catch {
      // skip
    }
  }

  if (count === 0) {
    alert("No files to download")
    return
  }

  const zipBlob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${guestName}-photos.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
