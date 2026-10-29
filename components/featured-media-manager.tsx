'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { addToFeatured, removeFromFeatured } from '@/app/actions/featured-media'
import type { MediaItem } from '@/lib/types'

interface FeaturedMediaManagerProps {
  allMedia: MediaItem[]
}

interface FeaturedItem {
  id: string
  media_id: string
  created_at: string
}

export function FeaturedMediaManager({ allMedia }: FeaturedMediaManagerProps) {
  const [featuredMedia, setFeaturedMedia] = useState<FeaturedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchFeaturedMedia()
  }, [])

  const fetchFeaturedMedia = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('featured_media')
      .select('*')
      .order('created_at', { ascending: false })

    setFeaturedMedia(data || [])
    setIsLoading(false)
  }

  const handleAddToFeatured = async (mediaId: string) => {
    setIsSaving(true)
    const result = await addToFeatured(mediaId)
    if (result.success) {
      await fetchFeaturedMedia()
    } else {
      toast.error('Failed to add to featured', { description: result.error })
    }
    setIsSaving(false)
  }

  const handleRemoveFromFeatured = async (featuredId: string) => {
    setIsSaving(true)
    const result = await removeFromFeatured(featuredId)
    if (result.success) {
      await fetchFeaturedMedia()
    } else {
      toast.error('Failed to remove from featured', { description: result.error })
    }
    setIsSaving(false)
  }

  const featuredMediaIds = new Set(featuredMedia.map((f) => f.media_id))
  const imageMedia = allMedia.filter((m) => m.media_type === 'image')

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Featured Media Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Featured Media ({featuredMedia.length})
          </CardTitle>
          <CardDescription>
            Images displayed on the gallery homepage carousel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredMedia.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No featured media yet. Add some images below to get started.
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {featuredMedia.map((featured) => {
                const media = allMedia.find((m) => m.id === featured.media_id)
                if (!media) return null

                return (
                  <div key={featured.id} className="relative group">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={media.thumbnail_url || media.file_url}
                        alt="Featured media"
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveFromFeatured(featured.id)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to Featured Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add to Featured</CardTitle>
          <CardDescription>
            Select images to display in the homepage carousel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {imageMedia.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No images available. Upload some photos first.
            </p>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-h-96 overflow-y-auto pr-2">
              {imageMedia.map((media) => {
                const isFeatured = featuredMediaIds.has(media.id)
                return (
                  <div key={media.id} className="relative group">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={media.thumbnail_url || media.file_url}
                        alt={`Media from ${media.uploaded_by}`}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="sm"
                          variant={isFeatured ? 'secondary' : 'default'}
                          onClick={() => handleAddToFeatured(media.id)}
                          disabled={isSaving || isFeatured}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                      {isFeatured && (
                        <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                          <Star className="h-4 w-4 fill-white text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {media.uploaded_by}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
