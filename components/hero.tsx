"use client"

import Link from "next/link"
import { Heart, Camera } from "lucide-react"
import { siteConfig } from "@/lib/site-config"

interface HeroProps {
  totalPhotos: number
  totalGuests: number
}

export function Hero({ totalPhotos, totalGuests }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pb-8 pt-12 sm:pb-12 sm:pt-16">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        {/* Heart ornament */}
        <div className="mb-6 inline-flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/60" />
            <Heart className="h-5 w-5 fill-primary/50 text-primary" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/60" />
          </div>
        </div>

        <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground sm:text-5xl md:text-6xl md:font-light">
          <span className="block text-balance">{siteConfig.coupleNames}</span>
          <span className="block text-balance mt-1 text-primary">Wedding Memories</span>
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:mt-6 sm:text-lg">
          A collection of beautiful moments captured by our beloved guests
        </p>

        {/* Stats */}
        <div className="mt-8 flex items-center justify-center gap-8 sm:gap-12">
          <div className="text-center">
            <div className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {totalPhotos}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              Photos
            </div>
          </div>
          <div className="h-12 w-0.5 bg-border/70" />
          <div className="text-center">
            <div className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {totalGuests}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              Contributors
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-3.5 text-base font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
          >
            <Camera className="h-5 w-5" />
            Share Your Photos
          </Link>
          <p className="text-xs text-muted-foreground">
            Took photos today? Add them to our shared album
          </p>
        </div>
      </div>
    </section>
  )
}
