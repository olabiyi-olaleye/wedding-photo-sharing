'use client'

import Image from 'next/image'
import { Loader2, Download, Trash2, Video, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { downloadUploaderZip } from '@/lib/zip-download'
import type { MediaItem } from '@/lib/types'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AdminUploaderGroupProps {
  uploaderName: string
  media: MediaItem[]
  onDeleteMedia: (item: MediaItem) => Promise<void>
  deletingId: string | null
}

export function AdminUploaderGroup({
  uploaderName,
  media,
  onDeleteMedia,
  deletingId,
}: AdminUploaderGroupProps) {
  const uploaderMedia = media.filter((m) => m.uploaded_by === uploaderName)
  const handleDownloadGroup = () => {
    downloadUploaderZip(uploaderName)
  }

  const photoCount = uploaderMedia.filter((m) => m.media_type === 'image').length
  const videoCount = uploaderMedia.filter((m) => m.media_type === 'video').length

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <Link 
          href={`/admin/uploader/${encodeURIComponent(uploaderName)}`}
          className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <CardTitle className="text-lg">{uploaderName}</CardTitle>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
            {videoCount > 0 && <span>{videoCount} video{videoCount !== 1 ? 's' : ''}</span>}
          </div>
        </Link>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadGroup}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Link href={`/admin/uploader/${encodeURIComponent(uploaderName)}`}>
            <Button variant="outline" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {uploaderMedia.map((item) => (
            <div key={item.id} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.thumbnail_url || item.file_url}
                  alt={`Photo by ${item.uploaded_by}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                {item.media_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-8 w-8 text-primary-foreground drop-shadow-lg" />
                  </div>
                )}
              </div>
              <div className="mt-2 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this media?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        the {item.media_type} uploaded by {item.uploaded_by}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteMedia(item)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
