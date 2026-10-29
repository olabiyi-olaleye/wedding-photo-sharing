"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, Heart, Loader2 } from "lucide-react"
import { useMedia } from "@/lib/media-context"
import { MediaLightbox } from "@/components/media-lightbox"
import { createClient } from "@/lib/supabase/client"
import type { MediaItem } from "@/lib/types"

export function MediaGrid() {
  const { refreshKey } = useMedia()
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("media")
      .select("*")
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false })
      .then(({ data }) => {
        if (data) setMedia(data)
        setIsLoading(false)
      })
  }, [refreshKey])

  const handleClose = () => setSelectedIndex(null)

  const handlePrevious = () =>
    setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : media.length - 1))

  const handleNext = () =>
    setSelectedIndex((i) => (i !== null && i < media.length - 1 ? i + 1 : 0))

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-medium text-foreground">No Photos Yet</h3>
          <p className="mt-1 text-muted-foreground">
            Be the first to share a beautiful moment from the wedding!
          </p>
        </div>
      </div>
    )
  }

  const selectedMedia = selectedIndex !== null ? media[selectedIndex] : null

  return (
    <>
      <div className="columns-2 gap-1 sm:columns-3 md:columns-4 lg:columns-5">
        {media.map((item, index) => (
          <div key={item.id} className="mb-1 break-inside-avoid">
            <MediaGridItem
              item={item}
              onClick={() => setSelectedIndex(index)}
            />
          </div>
        ))}
      </div>

      {selectedMedia && (
        <MediaLightbox
          media={selectedMedia}
          onClose={handleClose}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={media.length > 1}
          hasNext={media.length > 1}
          currentIndex={selectedIndex ?? undefined}
          totalCount={media.length}
        />
      )}
    </>
  )
}

interface MediaGridItemProps {
  item: MediaItem
  onClick: () => void
}

function MediaGridItem({ item, onClick }: MediaGridItemProps) {
  const isVideo = item.media_type === "video"
  const thumbnailUrl = item.thumbnail_url || item.file_url
  const aspectRatio = item.width && item.height
    ? item.width / item.height
    : 3 / 4

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      style={{ aspectRatio: aspectRatio.toString() }}
    >
      <Image
        src={thumbnailUrl}
        alt={`Photo by ${item.uploaded_by}`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
      />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
            <Play className="h-5 w-5 text-foreground" fill="currentColor" />
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-primary-foreground">
          {item.uploaded_by}
        </p>
      </div>
    </button>
  )
}
