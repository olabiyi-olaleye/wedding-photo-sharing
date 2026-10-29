'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Download, Trash2, Video, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { deleteMedia } from '@/app/actions/admin-delete'
import { downloadUploaderZip } from '@/lib/zip-download'
import { MediaLightbox } from '@/components/media-lightbox'
import { toast } from 'sonner'
import type { MediaItem } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function UploaderDetailsPage() {
  const params = useParams()
  const uploaderName = decodeURIComponent(params.uploaderName as string)

  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null)
  const [isSingleDeleting, setIsSingleDeleting] = useState(false)
  const itemsPerPage = 20

  useEffect(() => {
    fetchUploaderMedia()
  }, [])

  const fetchUploaderMedia = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('uploaded_by', uploaderName)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })

    if (!error && data) setMedia(data)
    setIsLoading(false)
  }

  const removeMedia = (id: string) => setMedia((prev) => prev.filter((m) => m.id !== id))

  const handleSingleDelete = async () => {
    if (!mediaToDelete) return
    setIsSingleDeleting(true)
    const result = await deleteMedia(mediaToDelete.id)
    setIsSingleDeleting(false)
    setMediaToDelete(null)
    if (result.success) {
      removeMedia(mediaToDelete.id)
      if (selectedIndex !== null) setSelectedIndex(null)
      toast.success("Photo deleted", { description: "Removed from gallery." })
    } else {
      toast.error("Delete failed", { description: result.error || "Could not delete photo." })
    }
  }

  const handleDownload = () => downloadUploaderZip(uploaderName)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true)
    let deleted = 0
    for (const id of selectedIds) {
      const result = await deleteMedia(id)
      if (result.success) deleted++
    }
    setMedia((prev) => prev.filter((m) => !selectedIds.has(m.id)))
    setSelectedIds(new Set())
    setIsBulkDeleting(false)
    setBulkDeleteOpen(false)
    setSelectMode(false)
    toast.success(`${deleted} photo${deleted !== 1 ? 's' : ''} deleted`)
  }

  const totalPages = Math.ceil(media.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMedia = media.slice(startIndex, startIndex + itemsPerPage)
  const photoCount = media.filter((m) => m.media_type === 'image').length
  const videoCount = media.filter((m) => m.media_type === 'video').length
  const selectedMedia = selectedIndex !== null ? paginatedMedia[selectedIndex] : null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-xl font-semibold">{uploaderName}</h1>
              <p className="text-sm text-muted-foreground">
                {photoCount} photo{photoCount !== 1 ? 's' : ''}
                {videoCount > 0 && ` · ${videoCount} video${videoCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectMode && selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={isBulkDeleting}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Delete {selectedIds.size}
              </Button>
            )}
            <Button
              variant={selectMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => { setSelectMode((v) => !v); setSelectedIds(new Set()) }}
              className="gap-1.5"
            >
              {selectMode ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
              {selectMode ? 'Cancel' : 'Select'}
            </Button>
            <Button onClick={handleDownload} disabled={media.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download All</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {media.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No media uploaded by this guest</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="columns-2 gap-1 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6">
              {paginatedMedia.map((item, idx) => (
                <div key={item.id} className="mb-1 break-inside-avoid">
                  <MediaThumbnail
                    item={item}
                    selectMode={selectMode}
                    selected={selectedIds.has(item.id)}
                    onSelect={() => toggleSelect(item.id)}
                    onClick={() => { if (!selectMode) setSelectedIndex(idx) }}
                    onDeleteClick={() => setMediaToDelete(item)}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
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
      </main>

      {selectedMedia && (
        <MediaLightbox
          media={selectedMedia}
          onClose={() => setSelectedIndex(null)}
          onPrevious={() => setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() => setSelectedIndex((i) => (i !== null && i < paginatedMedia.length - 1 ? i + 1 : i))}
          hasPrevious={selectedIndex !== null && selectedIndex > 0}
          hasNext={selectedIndex !== null && selectedIndex < paginatedMedia.length - 1}
          onDeleted={removeMedia}
          currentIndex={selectedIndex ?? undefined}
          totalCount={paginatedMedia.length}
          onDelete={deleteMedia}
        />
      )}

      {/* Single photo delete confirmation */}
      <AlertDialog open={!!mediaToDelete} onOpenChange={(open) => { if (!open) setMediaToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This photo will be permanently removed from the gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSingleDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSingleDelete}
              disabled={isSingleDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSingleDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1 inline" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              These photos will be permanently removed from the gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MediaThumbnail({
  item,
  selectMode,
  selected,
  onSelect,
  onClick,
  onDeleteClick,
}: {
  item: MediaItem
  selectMode: boolean
  selected: boolean
  onSelect: () => void
  onClick: () => void
  onDeleteClick: () => void
}) {
  const isVideo = item.media_type === 'video'
  const aspectRatio = item.width && item.height ? item.width / item.height : 3 / 4

  return (
    <div
      className="group relative w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/50 cursor-pointer transition-all hover:ring-primary/50 hover:shadow-lg"
      style={{ aspectRatio: aspectRatio.toString() }}
      onClick={selectMode ? onSelect : onClick}
    >
      <Image
        src={item.thumbnail_url || item.file_url}
        alt={`Photo by ${item.uploaded_by}`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
        unoptimized
      />

      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
            <Video className="h-5 w-5 text-foreground ml-0.5" />
          </div>
        </div>
      )}

      {/* Select mode: checkbox overlay */}
      {selectMode && (
        <div className={`absolute inset-0 flex items-start justify-end p-2 transition-colors ${selected ? 'bg-primary/30' : 'bg-black/10'}`}>
          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-white bg-black/30'}`}>
            {selected && <span className="text-white text-xs font-bold">✓</span>}
          </div>
        </div>
      )}

      {/* Normal mode: hover trash icon */}
      {!selectMode && (
        <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteClick() }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
            aria-label="Delete photo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
