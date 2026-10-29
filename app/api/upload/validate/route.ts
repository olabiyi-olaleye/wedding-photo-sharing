// Server-side file validation using magic bytes (file signatures).
// This prevents MIME-type spoofing where a malicious file is renamed to .jpg.
// Called by the upload page before sending a file to Supabase storage.

const ALLOWED_SIGNATURES: { bytes: number[]; mask?: number[]; type: string }[] = [
  // JPEG
  { bytes: [0xff, 0xd8, 0xff], type: "image/jpeg" },
  // PNG
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], type: "image/png" },
  // GIF
  { bytes: [0x47, 0x49, 0x46, 0x38], type: "image/gif" },
  // WebP (RIFF....WEBP)
  { bytes: [0x52, 0x49, 0x46, 0x46], type: "image/webp" }, // checked separately below
  // HEIC / HEIF — ftyp box at offset 4
  { bytes: [0x66, 0x74, 0x79, 0x70], type: "image/heic" }, // checked at offset 4
  // MP4 / MOV — also ftyp box
  { bytes: [0x66, 0x74, 0x79, 0x70], type: "video/mp4" }, // same prefix, handled below
]

function detectType(header: Uint8Array): string | null {
  // JPEG
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return "image/jpeg"
  // PNG
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) return "image/png"
  // GIF
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) return "image/gif"
  // WebP: RIFF at 0, WEBP at 8
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
      header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) return "image/webp"
  // HEIC/HEIF/MP4/MOV: ftyp box starts at byte 4
  if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
    // Brand at bytes 8-11
    const brand = String.fromCharCode(header[8], header[9], header[10], header[11])
    if (brand.startsWith("heic") || brand.startsWith("mif1") || brand.startsWith("msf1")) return "image/heic"
    // mp4, M4V, isom, qt__ etc.
    return "video/mp4"
  }
  return null
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return Response.json({ valid: false, error: "No file provided" }, { status: 400 })
    }

    // Read only the first 16 bytes — enough for all signatures
    const slice = file.slice(0, 16)
    const buf = await slice.arrayBuffer()
    const header = new Uint8Array(buf)

    const detected = detectType(header)

    if (!detected) {
      return Response.json(
        { valid: false, error: "Unsupported file type. Please upload JPEG, PNG, GIF, WebP, or HEIC photos." },
        { status: 415 }
      )
    }

    if (detected.startsWith("video/")) {
      return Response.json(
        { valid: false, error: "Videos are not accepted — photos only." },
        { status: 415 }
      )
    }

    const declaredType = file.type.toLowerCase()
    if (!declaredType.startsWith("image/")) {
      return Response.json(
        { valid: false, error: "File content does not match its declared type." },
        { status: 415 }
      )
    }

    return Response.json({ valid: true, detectedType: detected })
  } catch {
    return Response.json({ valid: false, error: "Validation failed" }, { status: 500 })
  }
}
