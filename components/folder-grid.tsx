"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Camera, ImagePlus, Search, X } from "lucide-react"
import { useMedia } from "@/lib/media-context"
import { useGuestFolders } from "@/hooks/use-guest-folders"
import { GuestFolderCard } from "@/components/guest-folder-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ITEMS_PER_PAGE = 12

export function FolderGrid() {
  const { refreshKey } = useMedia()
  const { guestFolders, isLoading } = useGuestFolders(refreshKey)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return guestFolders
    const q = search.toLowerCase()
    return guestFolders.filter(
      (f) =>
        f.guestName.toLowerCase().includes(q) ||
        f.guestTag?.toLowerCase().includes(q)
    )
  }, [guestFolders, search])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50">
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="border-t border-border/50 p-4">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (guestFolders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-10 w-10 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-semibold text-foreground">No Photos Yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
          Be the first to share your memories from our special day.
        </p>
        <Link href="/upload" className="mt-6">
          <Button className="gap-2 rounded-full">
            <ImagePlus className="h-4 w-4" />
            Upload Photos
          </Button>
        </Link>
      </div>
    )
  }

  const displayed = filtered.slice(0, displayCount)
  const hasMore = displayCount < filtered.length

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or relationship…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setDisplayCount(ITEMS_PER_PAGE) }}
          className="pl-9 pr-9 rounded-full"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 py-12 text-center">
          <p className="text-muted-foreground">No albums match &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch("")} className="mt-2 text-sm text-primary hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayed.map((folder) => (
              <GuestFolderCard key={folder.guestId} folder={folder} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                onClick={() => setDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
                variant="outline"
                className="gap-2 rounded-full px-8"
                size="lg"
              >
                Load More Albums
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
