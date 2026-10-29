"use client"

import Image from "next/image"
import Link from "next/link"
import { Camera, User } from "lucide-react"
import { useState } from "react"
import type { GuestFolder } from "@/lib/types"

interface GuestFolderCardProps {
  folder: GuestFolder
}

export function GuestFolderCard({ folder }: GuestFolderCardProps) {
  const [imgError, setImgError] = useState(false)

  const initials = folder.guestName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Link href={`/guest/${encodeURIComponent(folder.guestId)}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:ring-primary/40 hover:-translate-y-2">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {folder.coverImage && !imgError ? (
            <Image
              src={folder.coverImage}
              alt={`${folder.guestName}'s photos`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Camera className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80" />
          
          {/* Photo count badge */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Camera className="h-3 w-3" />
            <span>{folder.photoCount}</span>
          </div>
          
          {/* Guest info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white backdrop-blur-sm ring-2 ring-white/30">
                {initials || <User className="h-4 w-4" />}
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-serif text-lg font-medium text-white">
                  {folder.guestName}
                </h3>
                {folder.guestTag && (
                  <p className="truncate text-xs text-white/70">
                    {folder.guestTag}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="flex items-center justify-between border-t border-border/50 bg-card/80 px-4 py-3 backdrop-blur-sm">
          <span className="text-xs text-muted-foreground">
            {folder.photoCount} {folder.photoCount === 1 ? "photo" : "photos"}
          </span>
          <span className="text-xs font-medium text-primary group-hover:underline">
            View all
          </span>
        </div>
      </div>
    </Link>
  )
}
