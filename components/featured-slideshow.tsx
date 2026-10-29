'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import type { MediaItem } from '@/lib/types'

export function FeaturedSlideshow() {
  const [featuredMedia, setFeaturedMedia] = useState<MediaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Fetch featured media
    const fetchFeatured = async () => {
      const supabase = createClient()
      const { data: featured } = await supabase
        .from('featured_media')
        .select('media_id')

      if (featured && featured.length > 0) {
        const mediaIds = featured.map((f) => f.media_id)
        const { data: media } = await supabase
          .from('media')
          .select('*')
          .in('id', mediaIds)
          .eq('media_type', 'image')

        if (media) {
          setFeaturedMedia(media as MediaItem[])
        }
      }
      setIsLoading(false)
    }

    fetchFeatured()
  }, [])

  useEffect(() => {
    if (featuredMedia.length === 0 || isHovered) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMedia.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [featuredMedia, isHovered])

  if (isLoading || featuredMedia.length === 0) {
    return null
  }

  const currentPhoto = featuredMedia[currentIndex]

  return (
    <div
      className="relative h-96 w-full overflow-hidden rounded-2xl md:h-[500px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image with fade transition */}
      <Image
        key={currentPhoto.id}
        src={currentPhoto.file_url}
        alt="Featured wedding photo"
        fill
        className="object-cover object-top"
        priority
        sizes="(max-width: 768px) 100vw, 100vw"
      />

      {/* Fade overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      {/* Dots indicator */}
      {featuredMedia.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {featuredMedia.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to photo ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows (shown on hover) */}
      {featuredMedia.length > 1 && isHovered && (
        <>
          <button
            onClick={() =>
              setCurrentIndex(
                (prev) => (prev - 1 + featuredMedia.length) % featuredMedia.length
              )
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors"
            aria-label="Previous photo"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredMedia.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors"
            aria-label="Next photo"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
