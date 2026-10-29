'use client'

import { Heart, ArrowRight, UploadCloud, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'

interface UploadSuccessProps {
  guestId: string
  guestName: string
  photoCount: number
}

export function UploadSuccess({ guestId, guestName, photoCount }: UploadSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">

        {/* Decorative heart */}
        <div className="flex justify-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
            <div className="absolute inset-2 rounded-full bg-primary/10" />
            <Heart className="h-12 w-12 text-primary relative fill-primary/30" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="font-serif text-3xl font-semibold text-foreground">
            Thank you, {guestName.split(" ")[0]}!
          </h2>
          <p className="text-lg text-muted-foreground">
            Your {photoCount} {photoCount === 1 ? "photo is" : "photos are"} now part of{" "}
            <span className="text-primary font-medium">{siteConfig.coupleNames}</span>'s story.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
            <Heart className="h-3 w-3 fill-primary/40 text-primary/40" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Link href={`/guest/${guestId}`} className="w-full">
            <Button size="lg" className="w-full gap-2 rounded-full">
              <Images className="h-5 w-5" />
              See Your Photos
            </Button>
          </Link>

          <Link href="/upload" className="w-full">
            <Button size="lg" variant="outline" className="w-full gap-2 rounded-full">
              <UploadCloud className="h-5 w-5" />
              Upload More
            </Button>
          </Link>
        </div>

        {/* Back to home */}
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="h-3 w-3 rotate-180" />
          Back to gallery
        </Link>
      </div>
    </div>
  )
}
