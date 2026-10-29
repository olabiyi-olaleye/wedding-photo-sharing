"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

// The context only carries a refresh signal — no media data.
// Each page/component fetches its own paginated data and re-fetches when
// refreshKey changes (bumped by any DB INSERT/UPDATE/DELETE via Realtime).
// This eliminates the 1000-item global cap and avoids re-rendering every
// consumer on every unrelated photo change.

interface MediaContextType {
  refreshKey: number
  triggerRefresh: () => void
}

const MediaContext = createContext<MediaContextType | undefined>(undefined)

export function MediaProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("media-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "media" }, () => {
        triggerRefresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [triggerRefresh])

  return (
    <MediaContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia() {
  const ctx = useContext(MediaContext)
  if (!ctx) throw new Error("useMedia must be used within a MediaProvider")
  return ctx
}
