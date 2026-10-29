"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import {
  compressImage,
  generateThumbnail,
  isImageFile,
  getMediaType,
} from "@/lib/image-compression"
import { useMedia } from "@/lib/media-context"

interface UploadButtonProps {
  guestName: string
}

interface UploadStatus {
  file: File
  progress: number
  status: "pending" | "compressing" | "uploading" | "complete" | "error"
  error?: string
}

const MAX_FILE_SIZE_MB = 100
const MAX_FILES = 50

export function UploadButton({ guestName }: UploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploads, setUploads] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { triggerRefresh } = useMedia()

  const updateUploadStatus = useCallback(
    (index: number, updates: Partial<UploadStatus>) => {
      setUploads((prev) =>
        prev.map((upload, i) => (i === index ? { ...upload, ...updates } : upload))
      )
    },
    []
  )

  const processFile = useCallback(
    async (file: File, index: number) => {
      const supabase = createClient()

      try {
        // Update to compressing
        updateUploadStatus(index, { status: "compressing", progress: 10 })

        let fileToUpload: Blob = file
        let width: number | undefined
        let height: number | undefined
        let thumbnailBlob: Blob | undefined

        // Process image
        if (isImageFile(file)) {
          const compressed = await compressImage(file)
          fileToUpload = compressed.blob
          width = compressed.width
          height = compressed.height
          thumbnailBlob = await generateThumbnail(file)
        }

        updateUploadStatus(index, { progress: 30 })

        // Upload main file
        updateUploadStatus(index, { status: "uploading", progress: 40 })

        const timestamp = Date.now()
        const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.jpg`
        const filePath = `uploads/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("wedding-media")
          .upload(filePath, fileToUpload, {
            contentType: "image/jpeg",
            cacheControl: "3600",
          })

        if (uploadError) throw uploadError

        updateUploadStatus(index, { progress: 70 })

        // Upload thumbnail if exists
        let thumbnailPath: string | undefined
        if (thumbnailBlob) {
          const thumbFileName = `${timestamp}-thumb.jpg`
          thumbnailPath = `thumbnails/${thumbFileName}`

          await supabase.storage
            .from("wedding-media")
            .upload(thumbnailPath, thumbnailBlob, {
              contentType: "image/jpeg",
              cacheControl: "3600",
            })
        }

        updateUploadStatus(index, { progress: 85 })

        // Get public URLs
        const { data: { publicUrl: fileUrl } } = supabase.storage
          .from("wedding-media")
          .getPublicUrl(filePath)

        let thumbnailUrl: string | undefined
        if (thumbnailPath) {
          const { data: { publicUrl } } = supabase.storage
            .from("wedding-media")
            .getPublicUrl(thumbnailPath)
          thumbnailUrl = publicUrl
        }

        // Insert into database
        const { data: mediaData, error: dbError } = await supabase
          .from("media")
          .insert({
            file_url: fileUrl,
            thumbnail_url: thumbnailUrl,
            media_type: getMediaType(file),
            uploaded_by: guestName,
            file_size: fileToUpload.size,
            width,
            height,
          })
          .select()
          .single()

        if (dbError) throw dbError

        if (mediaData) {
          triggerRefresh()
        }

        updateUploadStatus(index, { status: "complete", progress: 100 })
      } catch (error) {
        updateUploadStatus(index, {
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        })
      }
    },
    [guestName, updateUploadStatus, triggerRefresh]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      
      if (files.length === 0) return
      if (files.length > MAX_FILES) {
        alert(`Please select up to ${MAX_FILES} files at a time`)
        return
      }

      // Filter valid files
      const validFiles = files.filter((file) => {
        if (!isImageFile(file)) return false
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false
        return true
      })

      if (validFiles.length === 0) {
        alert("No valid files selected. Please choose photos under 100MB.")
        return
      }

      // Initialize upload status
      const newUploads: UploadStatus[] = validFiles.map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }))
      setUploads(newUploads)
      setIsOpen(true)
      setIsUploading(true)

      // Process files sequentially to avoid overwhelming the browser
      for (let i = 0; i < validFiles.length; i++) {
        await processFile(validFiles[i], i)
      }

      setIsUploading(false)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [processFile]
  )

  const handleClose = () => {
    if (!isUploading) {
      setIsOpen(false)
      setUploads([])
    }
  }

  const completedCount = uploads.filter((u) => u.status === "complete").length
  const errorCount = uploads.filter((u) => u.status === "error").length

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Photos</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {isUploading ? "Uploading..." : "Upload Complete"}
            </DialogTitle>
            <DialogDescription>
              {isUploading
                ? `Uploading ${uploads.length} file${uploads.length > 1 ? "s" : ""}`
                : `${completedCount} uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ""}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {uploads.map((upload, index) => (
              <UploadItem key={index} upload={upload} />
            ))}
          </div>

          {!isUploading && (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function UploadItem({ upload }: { upload: UploadStatus }) {
  const statusIcons = {
    pending: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    compressing: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    uploading: <Upload className="h-4 w-4 text-primary" />,
    complete: <CheckCircle2 className="h-4 w-4 text-success" />,
    error: <AlertCircle className="h-4 w-4 text-destructive" />,
  }

  const statusLabels = {
    pending: "Waiting...",
    compressing: "Compressing...",
    uploading: "Uploading...",
    complete: "Complete",
    error: upload.error || "Error",
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {statusIcons[upload.status]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{upload.file.name}</p>
          <p className="text-xs text-muted-foreground">{statusLabels[upload.status]}</p>
        </div>
      </div>
      {upload.status !== "complete" && upload.status !== "error" && (
        <Progress value={upload.progress} className="h-1" />
      )}
    </div>
  )
}
