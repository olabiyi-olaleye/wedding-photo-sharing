'use client'

import { use } from 'react'
import { useMedia } from '@/lib/media-context'
import { useGuestFolders } from '@/hooks/use-guest-folders'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { FolderGrid } from '@/components/folder-grid'

const GALLERY_TOKEN = process.env.NEXT_PUBLIC_GALLERY_TOKEN || ''

export default function GalleryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const { refreshKey } = useMedia()
  const { stats } = useGuestFolders(refreshKey)

  if (token !== GALLERY_TOKEN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-3xl">Gallery Not Found</h1>
          <p className="text-muted-foreground">This gallery link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header hideUploadButton />

      <main>
        <Hero totalPhotos={stats.totalPhotos} totalGuests={stats.totalGuests} />

        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Guest Albums
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">View photos from our special day</p>
          </div>
          <FolderGrid />
        </section>
      </main>
    </div>
  )
}
