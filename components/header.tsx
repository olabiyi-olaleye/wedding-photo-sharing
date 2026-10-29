"use client"

import Link from "next/link"
import { Camera, Plus, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { siteConfig } from "@/lib/site-config"

interface HeaderProps {
  hideUploadButton?: boolean
}

export function Header({ hideUploadButton }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              {siteConfig.weddingName}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Photo Gallery
            </span>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          {!hideUploadButton && (
            <Link href="/upload">
              <Button 
                size="sm" 
                className="gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Photos</span>
              </Button>
            </Link>
          )}
          
          <ThemeToggle />
          
          <Link href="/admin/login">
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground/30 hover:text-muted-foreground/70"
              aria-label="Admin"
            >
              <Lock className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
