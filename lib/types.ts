export type MediaItem = {
  id: string
  file_url: string
  thumbnail_url: string | null
  media_type: "image" | "video"
  uploaded_by: string
  guest_tag: string | null
  file_size: number | null
  width: number | null
  height: number | null
  uploaded_at: string
}

export type GuestIdentity = {
  guestId: string
  guestName: string
  guestTag?: string
}

export type GuestFolder = {
  guestId: string
  guestName: string
  guestTag?: string
  photoCount: number
  coverImage: string
  lastUpdated: string
}

export type UploadQueueItem = {
  id: string
  file: File
  guestId: string
  guestName: string
  guestTag?: string
  caption?: string
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
}

export const GUEST_TAGS = [
  "Bride's Friend",
  "Bride's Family",
  "Groom's Friend",
  "Groom's Family",
  "Colleague",
  "Neighbor",
  "Other",
] as const

export type GuestTag = (typeof GUEST_TAGS)[number]
