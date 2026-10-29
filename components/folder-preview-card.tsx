'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Download, Video, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MediaItem } from '@/lib/types'

interface FolderPreviewCardProps {
  uploaderName: string
  media: MediaItem[]
  onDownload: () => void
  isDownloading: boolean
}

const MAX_PREVIEW_ITEMS = 5
const AUTO_SLIDE_INTERVAL = 3000

export function FolderPreviewCard({
  uploaderName,
  media,
  onDownload,
  isDownloading,
}: FolderPreviewCardProps) {
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const photoCount = media.filter((m) => m.media_type === 'image').length
  const videoCount = media.filter((m) => m.media_type === 'video').length
  const previewMedia = media.slice(0, MAX_PREVIEW_ITEMS)

  // Auto-slide when not hovering
  useEffect(() => {
    if (isHovering || previewMedia.length <= 1) return

    const interval = setInterval(() => {
      setCurrentPreviewIndex((prev) => (prev + 1) % previewMedia.length)
    }, AUTO_SLIDE_INTERVAL)

    return () => clearInterval(interval)
  }, [isHovering, previewMedia.length])

  const handlePrevious = () => {
    setCurrentPreviewIndex((prev) =>
      prev === 0 ? previewMedia.length - 1 : prev - 1
    )
  }

  const handleNext = () => {
    setCurrentPreviewIndex((prev) => (prev + 1) % previewMedia.length)
  }

  const currentMedia = previewMedia[currentPreviewIndex]

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:ring-2 hover:ring-primary/20">
      {/* Media Preview Section */}
      <div
        className="relative aspect-[4/3] overflow-hidden bg-muted"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {currentMedia && (
          <>
            <Image
              src={currentMedia.thumbnail_url || currentMedia.file_url}
              alt={`Preview from ${uploaderName}`}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Video Overlay */}
            {currentMedia.media_type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Video className="h-12 w-12 text-white opacity-80" />
              </div>
            )}

            {/* Navigation Arrows (show on hover) */}
            {previewMedia.length > 1 && (
              <>
                <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                  >
                    <ChevronRight className="h-4 w-4 text-white" />
                  </Button>
                </div>

                {/* Indicator Dots */}
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {previewMedia.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentPreviewIndex
                          ? 'w-6 bg-white'
                          : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Header Section */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-base">{uploaderName}</CardTitle>
            <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
              <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
              {videoCount > 0 && (
                <span>{videoCount} video{videoCount !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline text-xs">Download</span>
          </Button>
        </div>
      </CardHeader>

      {/* Footer Actions */}
      <CardContent className="flex gap-2 pt-0">
        <Link href={`/admin/uploader/${encodeURIComponent(uploaderName)}`} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View Gallery
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
