"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { useMedia } from "@/lib/media-context"
import { useGuestFolders } from "@/hooks/use-guest-folders"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturedSlideshow } from "@/components/featured-slideshow"
import { FolderGrid } from "@/components/folder-grid"

export default function HomePage() {
  const { refreshKey } = useMedia()
  const { stats } = useGuestFolders(refreshKey)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <Hero totalPhotos={stats.totalPhotos} totalGuests={stats.totalGuests} />

        <div className="container mx-auto px-4 pt-8">
          <FeaturedSlideshow />
        </div>

        <section className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
              Guest Albums
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Click on an album to view all photos from that guest
            </p>
          </div>

          <FolderGrid />
        </section>
      </main>

      <Link
        href="/upload"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95 md:hidden"
        aria-label="Upload photos"
      >
        <Plus className="h-7 w-7 md:h-8 md:w-8" />
      </Link>
    </div>
  )
}
