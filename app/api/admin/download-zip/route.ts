import { NextRequest } from "next/server"
import JSZip from "jszip"
import { jwtVerify } from "jose"
import { createAdminClientUnchecked } from "@/lib/supabase/admin"

// Extend the Vercel function timeout to handle large galleries.
// Capped at 60s on Hobby, up to 300s on Pro.
export const maxDuration = 60

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "")

// Tokens issued before the current deploy epoch are rejected, matching the
// same session-invalidation logic in middleware.ts and verify-admin.ts.
const DEPLOYED_AT = process.env.DEPLOYED_AT
  ? Math.floor(new Date(process.env.DEPLOYED_AT).getTime() / 1000)
  : 0

async function verifyRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("admin_token")?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    // Reject sessions invalidated by redeployment
    if (DEPLOYED_AT && typeof payload.deployedAt === "number" && payload.deployedAt < DEPLOYED_AT) {
      return false
    }
    return true
  } catch {
    return false
  }
}

// Max items per ZIP to keep memory and time bounded.
// Use ?offset=N to page through large galleries.
const ZIP_PAGE_SIZE = 150

export async function GET(request: NextRequest) {
  if (!(await verifyRequest(request))) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const uploader = searchParams.get("uploader")
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10))

  const supabase = createAdminClientUnchecked()

  let query = supabase
    .from("media")
    .select("id, file_url, uploaded_by, media_type, uploaded_at")
    .is("deleted_at", null)
    .order("uploaded_at", { ascending: false })
    .range(offset, offset + ZIP_PAGE_SIZE - 1)

  if (uploader) {
    query = query.eq("uploaded_by", uploader)
  }

  const { data: items, error } = await query

  if (error || !items?.length) {
    return new Response("No media found", { status: 404 })
  }

  const zip = new JSZip()

  for (const item of items) {
    try {
      const res = await fetch(item.file_url)
      if (!res.ok) continue
      const buf = await res.arrayBuffer()
      const ext = item.media_type === "video" ? "mp4" : "jpg"
      const safeUploader = item.uploaded_by.replace(/[^a-z0-9_\- ]/gi, "_")
      const name = `${safeUploader}/${new Date(item.uploaded_at).toISOString().slice(0, 10)}-${item.id.slice(0, 8)}.${ext}`
      zip.file(name, buf)
    } catch {
      // Skip files that fail to fetch — don't abort the whole archive
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })

  const hasMore = items.length === ZIP_PAGE_SIZE
  const pageLabel = offset > 0 ? `-part${Math.floor(offset / ZIP_PAGE_SIZE) + 1}` : ""
  const baseName = uploader
    ? `${uploader.replace(/[^a-z0-9_\- ]/gi, "_")}-photos`
    : "wedding-photos"

  return new Response(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${baseName}${pageLabel}-${Date.now()}.zip"`,
      "Content-Length": String(zipBuffer.length),
      // Let the client know whether there are more pages to download
      "X-Has-More": hasMore ? "true" : "false",
      "X-Next-Offset": String(offset + ZIP_PAGE_SIZE),
    },
  })
}
