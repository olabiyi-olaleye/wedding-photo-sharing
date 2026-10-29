"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo } from "react"
import { Download, Image as ImageIcon, Video, Loader2, ArrowLeft, LogOut, QrCode, Users, Search, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { siteConfig } from "@/lib/site-config"
import { deleteMedia } from "@/app/actions/admin-delete"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { downloadAllZip, downloadUploaderZip } from "@/lib/zip-download"
import { FolderPreviewCard } from "@/components/folder-preview-card"
import { FeaturedMediaManager } from "@/components/featured-media-manager"
import type { MediaItem } from "@/lib/types"
import Link from "next/link"
import { useRouter } from "next/navigation"

type SortOption = "recent" | "alphabetical" | "most-uploads"

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("gallery")
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [currentPage, setCurrentPage] = useState(1)
  const uploaderGroupsPerPage = 6

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false })
      .limit(1000)

    if (!error && data) {
      setMedia(data)
      if (data.length === 1000) {
        console.warn("Admin gallery: hit 1000-item limit. Some media may not be shown.")
      }
    }
    setIsLoading(false)
  }

  const handleDelete = async (item: MediaItem) => {
    setDeletingId(item.id)
    
    const result = await deleteMedia(item.id)
    
    if (result.success) {
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
      toast.success("Deleted", { description: "Media removed successfully." })
    } else {
      console.error("Delete failed:", result.error)
      toast.error("Delete failed", { description: result.error || "Could not remove media." })
    }

    setDeletingId(null)
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/')
  }

  const handleDownloadAll = () => {
    downloadAllZip()
  }

  const photoCount = media.filter((m) => m.media_type === "image").length
  const videoCount = media.filter((m) => m.media_type === "video").length

  // Get unique uploaders with filtering and sorting
  const uploaders = useMemo(() => {
    const uniqueUploaders = Array.from(
      new Set(media.map((item) => item.uploaded_by))
    )

    // Filter by search query
    const filtered = uniqueUploaders.filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort by selected option
    const sorted = filtered.sort((a, b) => {
      const mediaA = media.filter((m) => m.uploaded_by === a)
      const mediaB = media.filter((m) => m.uploaded_by === b)

      if (sortBy === "alphabetical") {
        return a.localeCompare(b)
      } else if (sortBy === "most-uploads") {
        return mediaB.length - mediaA.length
      } else {
        // recent
        const latestA = Math.max(
          ...mediaA.map((m) => new Date(m.uploaded_at).getTime())
        )
        const latestB = Math.max(
          ...mediaB.map((m) => new Date(m.uploaded_at).getTime())
        )
        return latestB - latestA
      }
    })

    return sorted
  }, [media, searchQuery, sortBy])

  // Pagination for uploader groups
  const totalPages = Math.ceil(uploaders.length / uploaderGroupsPerPage)
  const startIndex = (currentPage - 1) * uploaderGroupsPerPage
  const paginatedUploaders = uploaders.slice(startIndex, startIndex + uploaderGroupsPerPage)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 fill-primary/50 text-primary" />
              <h1 className="font-serif text-xl font-semibold">{siteConfig.coupleNames}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/guests">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Guests</span>
              </Button>
            </Link>
            <Link href="/admin/qr">
              <Button variant="outline" className="gap-2">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">QR Code</span>
              </Button>
            </Link>
            <Button onClick={handleDownloadAll} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download All</span>
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="icon" title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 ring-1 ring-primary/15">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Heart className="h-6 w-6 fill-primary/60 text-primary" />
            </div>
            <div>
              <p className="font-serif text-xl font-semibold text-foreground">{siteConfig.coupleNames} Wedding</p>
              <p className="text-sm text-muted-foreground">
                {media.length > 0
                  ? `${media.length} memories shared by ${uploaders.length} guests`
                  : "Your wedding gallery awaits — share the link with guests to start collecting memories"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { if (v === "guests") { router.push("/admin/guests"); return; } setActiveTab(v) }} className="w-full">
          <TabsList className="mb-8 w-full justify-start bg-transparent border-b rounded-none h-auto p-0 space-x-8">
            <TabsTrigger 
              value="gallery" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger 
              value="guests" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
            >
              <Users className="h-4 w-4" />
              Guests & RSVPs
            </TabsTrigger>
            <TabsTrigger 
              value="featured" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Featured Media
            </TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-8">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by uploader name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent Uploads</SelectItem>
                  <SelectItem value="most-uploads">Most Uploads</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-semibold text-foreground">{media.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-3xl font-semibold text-foreground">{photoCount}</p>
                  <p className="text-sm text-muted-foreground">Photos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-3xl font-semibold text-foreground">{videoCount}</p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grouped Media by Uploader */}
        {isLoading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <ImageIcon className="h-10 w-10 text-primary" />
            </div>
            <p className="font-serif text-xl font-semibold text-foreground">No media yet</p>
            <p className="text-sm text-muted-foreground">Photos will appear here once guests start uploading</p>
          </div>
        ) : uploaders.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 py-20 text-center">
            <p className="font-serif text-lg text-muted-foreground">No uploaders match your search</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Folder Preview Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedUploaders.map((uploaderName) => {
                const uploaderMedia = media.filter((m) => m.uploaded_by === uploaderName)
                const handleDownload = () => {
                  downloadUploaderZip(uploaderName)
                }
                
                return (
                  <FolderPreviewCard
                    key={uploaderName}
                    uploaderName={uploaderName}
                    media={uploaderMedia}
                    onDownload={handleDownload}
                    isDownloading={false}
                  />
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
          </TabsContent>

          {/* Guests Tab — navigates to /admin/guests */}
          <TabsContent value="guests" className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground">Guest Management</h3>
              <p className="mt-2 text-sm text-muted-foreground">Manage your guest list and track RSVPs</p>
              <Link href="/admin/guests" className="mt-6">
                <Button className="rounded-full gap-2">
                  <Users className="h-4 w-4" />
                  Open Guest Manager
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Featured Media Tab */}
          <TabsContent value="featured" className="space-y-8">
            <FeaturedMediaManager allMedia={media} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

interface AdminGuestsSectionProps {
  media: MediaItem[]
  isLoading: boolean
}

function AdminGuestsSection({ media, isLoading }: AdminGuestsSectionProps) {
  const guests = Array.from(
    new Map(
      media.map((item) => [
        item.uploaded_by,
        {
          name: item.uploaded_by,
          tag: item.guest_tag || "",
          photoCount: 0,
          lastUpload: item.uploaded_at,
        },
      ])
    ).entries()
  )
    .map(([_, guest]) => ({
      ...guest,
      photoCount: media.filter((m) => m.uploaded_by === guest.name).length,
      lastUpload: media
        .filter((m) => m.uploaded_by === guest.name)
        .reduce((latest, current) => 
          new Date(current.uploaded_at) > new Date(latest.uploaded_at) ? current : latest
        )?.uploaded_at || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.lastUpload).getTime() - new Date(a.lastUpload).getTime())

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (guests.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No guests have uploaded photos yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-foreground">Guest Name</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Category</th>
              <th className="text-center py-3 px-4 font-semibold text-foreground">Photos</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Last Upload</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.name} className="border-b hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 text-foreground font-medium">{guest.name}</td>
                <td className="py-3 px-4">
                  {guest.tag ? (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {guest.tag}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Not specified</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-sm">
                    {guest.photoCount}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs">
                  {new Date(guest.lastUpload).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
