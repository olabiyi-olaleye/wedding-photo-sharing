"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { GuestFolder } from "@/lib/types"

interface GalleryStats {
  totalPhotos: number
  totalGuests: number
}

export function useGuestFolders(refreshKey: number) {
  const [guestFolders, setGuestFolders] = useState<GuestFolder[]>([])
  const [stats, setStats] = useState<GalleryStats>({ totalPhotos: 0, totalGuests: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    // Fetch lightweight projection — only the columns needed to build folders.
    // No per-pixel data; this stays fast even at 5000 rows.
    const { data, error } = await supabase
      .from("media")
      .select("uploaded_by, guest_tag, uploaded_at, thumbnail_url, file_url")
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false })

    if (!error && data) {
      const folderMap = new Map<string, GuestFolder>()

      for (const item of data) {
        const existing = folderMap.get(item.uploaded_by)
        if (existing) {
          existing.photoCount += 1
        } else {
          folderMap.set(item.uploaded_by, {
            guestId: item.uploaded_by,
            guestName: item.uploaded_by,
            guestTag: item.guest_tag ?? undefined,
            photoCount: 1,
            coverImage: item.thumbnail_url ?? item.file_url,
            lastUpdated: item.uploaded_at,
          })
        }
      }

      const folders = Array.from(folderMap.values()).sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )

      setGuestFolders(folders)
      setStats({ totalPhotos: data.length, totalGuests: folderMap.size })
    }

    setIsLoading(false)
  }, []) // refreshKey omitted — caller passes it as dep to useEffect below

  useEffect(() => {
    fetch()
  }, [fetch, refreshKey])

  return { guestFolders, stats, isLoading }
}
