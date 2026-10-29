"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImagePlus,
  X,
  Heart,
  Sparkles,
  User,
  Tag,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import {
  compressImage,
  generateThumbnail,
  isImageFile,
  getMediaType,
} from "@/lib/image-compression"
import { getFileContentHash } from "@/lib/image-hash"
import { useMedia } from "@/lib/media-context"
import { GUEST_TAGS, type GuestTag } from "@/lib/types"
import { UploadSuccess } from "@/components/upload-success"
import { UploadProgressBar } from "@/components/upload-progress-bar"
import { validateUploaderName, validateGuestTag, sanitizeInput } from "@/lib/validation-schemas"
import { sendUploadNotification } from "@/app/actions/send-upload-email"
import { toast } from "sonner"

interface UploadStatus {
  file: File
  preview: string
  progress: number
  status: "pending" | "compressing" | "uploading" | "complete" | "error"
  error?: string
}

const MAX_IMAGE_SIZE_MB = 100
const MAX_FILES = 50

// This deployment is single-tenant — every upload belongs to the one legacy
// event seeded in migration 007. Required because migration 014/016 (applied
// to this project's DB ahead of the SaaS rollout) tightened the media INSERT
// RLS policy to require event_id on an open event; this app predates events.
const LEGACY_EVENT_SLUG = "demo-wedding"

const GUEST_TOKEN_KEY = 'guest_upload_token'

function getOrCreateGuestToken(): string {
  try {
    const existing = localStorage.getItem(GUEST_TOKEN_KEY)
    if (existing) return existing
    const token = crypto.randomUUID()
    localStorage.setItem(GUEST_TOKEN_KEY, token)
    return token
  } catch {
    return crypto.randomUUID()
  }
}

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<"info" | "upload" | "success">("info")
  const [guestName, setGuestName] = useState("")
  const [guestId, setGuestId] = useState("")
  const [guestToken, setGuestToken] = useState("")
  const [guestTag, setGuestTag] = useState<GuestTag | "">("")
  const [uploads, setUploads] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { triggerRefresh } = useMedia()

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate uploader name
    const nameValidation = validateUploaderName(guestName)
    if (!nameValidation.valid) {
      toast.error("Invalid name", { description: nameValidation.error || "Please enter a valid name." })
      return
    }

    // Validate guest tag if provided
    if (guestTag) {
      const tagValidation = validateGuestTag(guestTag)
      if (!tagValidation.valid) {
        toast.error("Invalid tag", { description: tagValidation.error || "Please select a valid tag." })
        return
      }
    }

    const sanitizedName = sanitizeInput(guestName)
    const token = getOrCreateGuestToken()
    setGuestId(sanitizedName)
    setGuestToken(token)
    setStep("upload")
  }

  const updateUploadStatus = useCallback(
    (index: number, updates: Partial<UploadStatus>) => {
      setUploads((prev) =>
        prev.map((upload, i) => (i === index ? { ...upload, ...updates } : upload))
      )
    },
    []
  )

  const processFile = useCallback(
    async (file: File, index: number, eventId: string) => {
      const supabase = createClient()

      try {
        updateUploadStatus(index, { status: "compressing", progress: 5 })

        // Server-side magic-byte validation — prevents MIME spoofing.
        // Only the file header is sent — the route only ever reads the first 16 bytes — so
        // this stays well under Vercel's 4.5MB function body limit regardless of photo size.
        const formData = new FormData()
        formData.append("file", file.slice(0, 64, file.type), file.name)
        const validateRes = await fetch("/api/upload/validate", { method: "POST", body: formData })
        if (!validateRes.ok) {
          let message = "File type not allowed"
          try {
            const body = await validateRes.json()
            message = body.error || message
          } catch {
            message = "Could not validate photo. Please try again."
          }
          throw new Error(message)
        }

        updateUploadStatus(index, { status: "compressing", progress: 10 })

        let fileToUpload: Blob = file
        let width: number | undefined
        let height: number | undefined
        let thumbnailBlob: Blob | undefined

        if (isImageFile(file)) {
          const compressed = await compressImage(file)
          fileToUpload = compressed.blob
          width = compressed.width
          height = compressed.height
          thumbnailBlob = await generateThumbnail(file)
        }

        updateUploadStatus(index, { progress: 30 })
        updateUploadStatus(index, { status: "uploading", progress: 40 })

        const timestamp = Date.now()
        const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.jpg`
        const filePath = `uploads/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("wedding-media")
          .upload(filePath, fileToUpload, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
          })

        if (uploadError) {
          // Provide helpful error message
          if (uploadError.message.includes("Bucket not found")) {
            throw new Error(
              "Storage bucket not configured. Please create 'wedding-media' bucket in Supabase Storage settings."
            )
          }
          throw uploadError
        }

        updateUploadStatus(index, { progress: 70 })

        let thumbnailPath: string | undefined
        if (thumbnailBlob) {
          const thumbFileName = `${timestamp}-thumb.jpg`
          thumbnailPath = `thumbnails/${thumbFileName}`

          await supabase.storage
            .from("wedding-media")
            .upload(thumbnailPath, thumbnailBlob, {
              contentType: "image/jpeg",
              cacheControl: "31536000",
            })
        }

        updateUploadStatus(index, { progress: 85 })

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

        // Calculate image hash for duplicate detection
        let imageHash = null
        if (isImageFile(file)) {
          try {
            imageHash = await getFileContentHash(file)
          } catch {
            // Hash generation is non-critical; skip silently
          }
        }

        const { data: mediaData, error: dbError } = await supabase
          .from("media")
          .insert({
            event_id: eventId,
            file_url: fileUrl,
            thumbnail_url: thumbnailUrl,
            media_type: getMediaType(file),
            uploaded_by: guestName.trim(),
            guest_tag: guestTag || null,
            file_size: fileToUpload.size,
            width,
            height,
            file_hash: imageHash,
            guest_token: guestToken || null,
          })
          .select()
          .single()

        if (dbError) {
          // 23505 = unique violation on (event_id, guest_token, file_hash) —
          // this guest already uploaded this exact photo. Remove the orphaned
          // storage objects so duplicates don't accumulate in the bucket.
          if (dbError.code === "23505") {
            const orphans = thumbnailPath ? [filePath, thumbnailPath] : [filePath]
            await supabase.storage.from("wedding-media").remove(orphans)
            throw new Error("Already uploaded — this photo is in the gallery.")
          }
          throw dbError
        }

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
    [updateUploadStatus, triggerRefresh, guestName, guestTag, guestToken]
  )

  const processFiles = useCallback(
    async (files: File[]) => {
      const validFiles: File[] = []
      const rejectedUploads: UploadStatus[] = []

      for (const file of files) {
        const isImage = isImageFile(file)
        const isVideo = file.type.startsWith('video/')
        if (isVideo) {
          rejectedUploads.push({
            file, preview: URL.createObjectURL(file), progress: 0,
            status: 'error', error: 'Videos are not supported — photos only',
          })
        } else if (!isImage) {
          rejectedUploads.push({
            file, preview: URL.createObjectURL(file), progress: 0,
            status: 'error', error: 'Only photos are supported',
          })
        } else if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          rejectedUploads.push({
            file, preview: URL.createObjectURL(file), progress: 0,
            status: 'error', error: `Photo too large — max ${MAX_IMAGE_SIZE_MB}MB`,
          })
        } else {
          validFiles.push(file)
        }
      }

      const remainingSlots = MAX_FILES - uploads.length
      const acceptedFiles = validFiles.slice(0, remainingSlots)
      validFiles.slice(remainingSlots).forEach((file) => {
        rejectedUploads.push({
          file, preview: URL.createObjectURL(file), progress: 0,
          status: 'error', error: `Maximum ${MAX_FILES} files allowed`,
        })
      })

      if (rejectedUploads.length > 0) {
        setUploads((prev) => [...prev, ...rejectedUploads])
      }
      if (acceptedFiles.length === 0) return

      const newUploads: UploadStatus[] = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "pending" as const,
      }))

      setUploads((prev) => [...prev, ...newUploads])

      setIsUploading(true)

      const supabase = createClient()
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("slug", LEGACY_EVENT_SLUG)
        .single()

      if (eventError || !eventRow) {
        toast.error("Upload unavailable", { description: "Could not find the event. Please contact the couple." })
        setUploads((prev) => prev.map((u) => (newUploads.includes(u) ? { ...u, status: "error", error: "Event not found" } : u)))
        setIsUploading(false)
        return
      }
      const eventId = eventRow.id as string

      // Check rate limit before starting uploads
      try {
        const rateCheckResponse = await fetch('/api/upload/check-rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestToken }),
        })
        const rateCheckData = await rateCheckResponse.json()

        if (!rateCheckData.allowed) {
          toast.error("Upload limit reached", { description: "You've reached the maximum uploads per hour (30 files). Please try again later." })
          setIsUploading(false)
          return
        }
      } catch (error) {
        console.error('Rate limit check error:', error)
        // Continue anyway if rate limit check fails
      }

      const startIndex = uploads.length

      // Bounded concurrency: 3 workers each grab the next file until queue is empty.
      let nextFileIndex = 0
      async function worker() {
        while (true) {
          const fileIndex = nextFileIndex++
          if (fileIndex >= acceptedFiles.length) break
          await processFile(acceptedFiles[fileIndex], startIndex + fileIndex, eventId)
        }
      }
      const workers = Array.from({ length: Math.min(3, acceptedFiles.length) }, worker)
      await Promise.all(workers)

      // Fire-and-forget upload notification — failures must not block the upload flow
      sendUploadNotification(guestName, acceptedFiles.length, guestToken || guestId).catch(() => {})

      setIsUploading(false)
    },
    [processFile, uploads.length]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      processFiles(files)
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [processFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    },
    [processFiles]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeUpload = (index: number) => {
    setUploads((prev) => {
      const removed = prev[index]
      URL.revokeObjectURL(removed.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const completedCount = uploads.filter((u) => u.status === "complete").length
  const allComplete = uploads.length > 0 && completedCount === uploads.length

  // Show success screen after all uploads complete
  if (step === "success" && allComplete) {
    return (
      <UploadSuccess
        guestId={guestToken || guestId}
        guestName={guestName}
        photoCount={uploads.length}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-semibold text-foreground">
              Add Photos
            </span>
          </div>
          
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Step 1: Guest Info */}
        {step === "info" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">
                Share Your Memories
              </h1>
              <p className="mt-2 text-muted-foreground">
                Tell us a bit about yourself first
              </p>
            </div>

            {/* Info Form */}
            <form onSubmit={handleInfoSubmit} className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Your Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card text-base"
                  required
                />
              </div>

              {/* Tag Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  How do you know the couple?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {GUEST_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setGuestTag(tag)}
                      className={`flex items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        guestTag === tag
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue Button */}
              <Button
                type="submit"
                disabled={!guestName.trim()}
                className="w-full gap-2 rounded-full h-12 text-base"
                size="lg"
              >
                Continue to Upload
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === "upload" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ImagePlus className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">
                Upload Your Photos
              </h1>
              <p className="mt-2 text-muted-foreground">
                Help us capture every beautiful moment
              </p>
            </div>

            {/* User Info */}
            <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-border/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {guestName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{guestName}</p>
                  {guestTag && (
                    <p className="text-xs text-muted-foreground">{guestTag}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setStep("info")}
                className="text-sm text-primary hover:underline"
              >
                Change
              </button>
            </div>

            {/* Upload guidelines */}
            <div className="mb-6 rounded-2xl border border-border/50 bg-muted/40 px-4 py-3.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                What you can share
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  Photos only — JPEG, PNG, HEIC (no videos)
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  Up to <strong>{MAX_FILES} photos</strong> per upload
                </li>
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  Max <strong>{MAX_IMAGE_SIZE_MB} MB</strong> per photo
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/40" />
                  Have more than {MAX_FILES}? Upload in multiple batches
                </li>
              </ul>
            </div>

            {/* Upload Queue */}
            {uploads.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                    {allComplete && <Sparkles className="h-5 w-5 text-primary" />}
                    {allComplete ? "Upload Complete!" : "Uploading..."}
                  </h3>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {completedCount} / {uploads.length}
                  </span>
                </div>

                {/* Overall Progress Bar */}
                {!allComplete && (
                  <div className="mb-6">
                    <UploadProgressBar current={completedCount} total={uploads.length} />
                  </div>
                )}

                <div className="space-y-3">
                  {uploads.map((upload, index) => (
                    <UploadItem
                      key={index}
                      upload={upload}
                      onRemove={() => removeUpload(index)}
                    />
                  ))}
                </div>

                {allComplete && (
                  <div className="mt-8 space-y-3">
                    <Button
                      onClick={() => setStep("success")}
                      className="w-full rounded-full"
                      size="lg"
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative cursor-pointer overflow-hidden rounded-3xl border transition-all duration-300 ${
                isDragging
                  ? "border-primary/60 bg-primary/8 scale-[1.02] shadow-lg shadow-primary/15"
                  : "border-border/60 bg-gradient-to-b from-primary/5 to-background hover:border-primary/40 hover:from-primary/8"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={isUploading}
              />

              <div className="flex flex-col items-center justify-center py-16 text-center">
                {/* Decorative hearts */}
                <div className="mb-5 flex items-center gap-2">
                  <Heart className="h-3 w-3 text-primary/30" fill="currentColor" />
                  <Heart className={`h-5 w-5 transition-all duration-300 ${isDragging ? "text-primary scale-125" : "text-primary/60"}`} fill="currentColor" />
                  <Heart className="h-3 w-3 text-primary/30" fill="currentColor" />
                </div>

                <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                  isDragging ? "bg-primary/20 scale-110 shadow-lg shadow-primary/20" : "bg-primary/10"
                }`}>
                  <Upload className={`h-10 w-10 transition-colors ${
                    isDragging ? "text-primary" : "text-primary/70"
                  }`} />
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  {isDragging ? "Drop your memories here" : "Share Your Memories"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop or tap to select
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                  Photos only · Up to {MAX_FILES} files · Max {MAX_IMAGE_SIZE_MB}MB each
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function UploadItem({
  upload,
  onRemove,
}: {
  upload: UploadStatus
  onRemove: () => void
}) {
  const statusConfig = {
    pending: {
      icon: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
      label: "Waiting...",
      color: "text-muted-foreground",
    },
    compressing: {
      icon: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
      label: "Optimizing...",
      color: "text-primary",
    },
    uploading: {
      icon: <Upload className="h-4 w-4 text-primary animate-pulse" />,
      label: "Uploading...",
      color: "text-primary",
    },
    complete: {
      icon: <CheckCircle2 className="h-4 w-4 text-success" />,
      label: "Done",
      color: "text-success",
    },
    error: {
      icon: <AlertCircle className="h-4 w-4 text-destructive" />,
      label: upload.error || "Failed",
      color: "text-destructive",
    },
  }

  const status = statusConfig[upload.status]
  const canRemove = upload.status === "complete" || upload.status === "error"
  const showProgress = upload.status !== "complete" && upload.status !== "error"

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-3 ring-1 ring-border/50 transition-all hover:ring-border">
      {/* Preview */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
        <img
          src={upload.preview}
          alt=""
          className="h-full w-full object-cover"
        />
        {upload.status === "complete" && (
          <div className="absolute inset-0 flex items-center justify-center bg-success/20">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">
          {upload.file.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {status.icon}
          <span className={`text-xs ${status.color}`}>
            {status.label}
          </span>
        </div>
        {showProgress && (
          <Progress value={upload.progress} className="h-1.5 mt-2" />
        )}
      </div>

      {/* Remove Button */}
      {canRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
