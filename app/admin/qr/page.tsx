'use client'

import { useState, useEffect } from 'react'
import { Download, ArrowLeft, Printer, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import QRCode from 'qrcode'
import { siteConfig } from '@/lib/site-config'
import { toast } from 'sonner'

export default function AdminQRPage() {
  const [qrCode, setQrCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isSharing, setIsSharing] = useState(false)

  const galleryUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/`
    : siteConfig.url + '/'

  const shareText = `📸 Help us capture every moment! Scan to upload your photos from ${siteConfig.coupleNames}'s wedding — ${siteConfig.weddingDate}.`

  useEffect(() => { generateQRCode() }, [])

  const generateQRCode = async () => {
    try {
      setIsLoading(true)
      setError('')
      const dataUrl = await QRCode.toDataURL(galleryUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        width: 600,
        color: { dark: '#1c1810', light: '#ffffff' },
      })
      setQrCode(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrCode) return
    const a = document.createElement('a')
    a.href = qrCode
    a.download = 'wedding-gallery-qr.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleShare = async () => {
    if (!qrCode || isSharing) return
    setIsSharing(true)
    try {
      const nav = navigator as Navigator & {
        share?: (data: ShareData & { files?: File[] }) => Promise<void>
        canShare?: (data: { files?: File[] }) => boolean
      }

      let file: File | undefined
      try {
        // Decode the data URL manually (not via fetch) — the app's CSP
        // connect-src doesn't allow fetching data: URLs.
        const [meta, base64] = qrCode.split(',')
        const mime = meta.match(/data:(.*);base64/)?.[1] ?? 'image/png'
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
        file = new File([bytes], 'wedding-gallery-qr.png', { type: mime })
      } catch {
        // Non-critical — share falls back to text + link without the image
      }

      if (nav.share) {
        // The link goes in `text` (not just the separate `url` field) even
        // when a file is attached — many share targets (e.g. WhatsApp) drop
        // a separate `url` once files are present, showing image + caption
        // with no link at all otherwise.
        const canShareFile = file && nav.canShare?.({ files: [file] })
        await nav.share(
          canShareFile
            ? { title: `${siteConfig.coupleNames} Wedding`, text: `${shareText} ${galleryUrl}`, files: [file!] }
            : { title: `${siteConfig.coupleNames} Wedding`, text: `${shareText} ${galleryUrl}` }
        )
        return
      }

      await navigator.clipboard.writeText(`${shareText} ${galleryUrl}`)
      toast.success('Copied to clipboard', { description: 'Paste it into WhatsApp, email, or any app to share.' })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return // user cancelled the share sheet
      toast.error('Could not share', { description: 'Try downloading the QR code instead.' })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <>
      {/* ── Screen UI ── */}
      <div className="no-print min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center px-4 gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="font-serif text-xl font-semibold">QR Code & Print Tickets</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-2xl space-y-8">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
              <p className="font-semibold">Error generating QR code</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={generateQRCode} variant="outline" size="sm" className="mt-4">Retry</Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !error && qrCode && (
            <>
              <div className="flex justify-center bg-white p-8 rounded-2xl border shadow-sm">
                <img src={qrCode} alt="Wedding Gallery QR Code" className="w-48 h-48" />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-1">Gallery URL</p>
                <p className="text-sm text-muted-foreground break-all font-mono">{galleryUrl}</p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-1">Share message preview</p>
                <p className="text-sm text-muted-foreground">{shareText}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button onClick={handleShare} disabled={isSharing} className="gap-2">
                  <Share2 className="h-4 w-4" />Share
                </Button>
                <Button onClick={handleDownload} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />Download QR
                </Button>
                <Button onClick={() => window.print()} variant="outline" className="gap-2">
                  <Printer className="h-4 w-4" />Print 6 Tickets
                </Button>
              </div>

              <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Print instructions</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Click <strong>Print 6 Tickets</strong> — prints one A4 sheet with 6 tickets (3 columns × 2 rows)</li>
                  <li>Cut along the dashed lines between tickets</li>
                  <li>One ticket per guest table</li>
                </ul>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Print Layout: 6 tickets, 3 columns × 2 rows ── */}
      {qrCode && (
        <div className="print-only tickets-page">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="ticket">

              {/* Header: ornament + name + date */}
              <div className="t-header">
                <div className="t-ornament">
                  <span className="t-line" />
                  <span className="t-heart">♥</span>
                  <span className="t-line" />
                </div>
                <div className="t-couple">{siteConfig.coupleNames}</div>
                <div className="t-subtitle">WEDDING MEMORIES</div>
                <div className="t-fields">
                  <div className="t-field">
                    <span className="t-label">DATE</span>
                    <span className="t-value">{siteConfig.weddingDate}</span>
                  </div>
                  <div className="t-sep" />
                  <div className="t-field">
                    <span className="t-label">OCCASION</span>
                    <span className="t-value">Wedding Celebration</span>
                  </div>
                </div>
              </div>

              {/* QR section: divider + QR + upload notice + divider */}
              <div className="t-qr-section">
                <div className="t-divider" />
                <div className="t-qr-wrap">
                  <img src={qrCode} alt="QR" className="t-qr-img" />
                  <div className="t-qr-label">SCAN &amp; SHARE</div>
                </div>
                <div className="t-upload-notice">
                  <span className="t-upload-primary">Upload up to <strong>50 photos</strong> at a time</span>
                  <span className="t-upload-secondary">For more, scan again in batches</span>
                </div>
                <div className="t-divider" />
              </div>

              {/* Footer: message + URL */}
              <div className="t-footer">
                <p className="t-message">
                  You captured a moment we&apos;ll cherish forever.
                  Scan to share your photos from today&apos;s celebration.
                </p>
                <div className="t-url">{galleryUrl}</div>
              </div>

            </div>
          ))}
        </div>
      )}

      <style>{`
        .print-only { display: none; }

        @media print {
          .no-print  { display: none !important; }
          .print-only { display: block; }

          @page { size: A4 portrait; margin: 10mm; }

          /*
           * Reset html, body AND their direct children (ThemeProvider /
           * MediaProvider wrappers from layout.tsx add fractional height
           * that caused the second-page bleed).
           */
          html, body, body > div {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: white;
          }

          /*
           * Grid safely within the 190×277mm printable area — 22mm buffer.
           * Width:  3×61mm + 2×3mm gap = 189mm  (≤ 190mm ✓)
           * Height: 2×126mm + 1×3mm gap = 255mm  (≤ 277mm ✓, 22mm spare)
           */
          .tickets-page {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(2, 126mm);
            gap: 3mm;
            width: 190mm;
            height: 255mm;
            overflow: hidden;
            box-sizing: border-box;
          }

          /* Ticket card — dashed border doubles as cut guide */
          .ticket {
            border: 1px dashed #c9a86c;
            border-radius: 3px;
            background: #faf8f5;
            font-family: 'Cormorant Garamond', Georgia, serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 3.5mm 3mm 3mm;
            box-sizing: border-box;
            height: 126mm;
            width: 100%;
            overflow: hidden;
            break-inside: avoid;
          }

          /* ── Header group ── */
          .t-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
          }

          .t-ornament {
            display: flex;
            align-items: center;
            width: 100%;
            gap: 3px;
            margin-bottom: 2mm;
          }
          .t-line  { flex: 1; height: 0.5px; background: #c9a86c; }
          .t-heart { color: #c9a86c; font-size: 7pt; line-height: 1; }

          .t-couple {
            font-size: 11.5pt;
            font-weight: 600;
            color: #1c1810;
            letter-spacing: 0.01em;
            text-align: center;
            line-height: 1.1;
          }

          .t-subtitle {
            font-size: 5pt;
            letter-spacing: 0.22em;
            color: #8a6a3a;
            text-transform: uppercase;
            margin-top: 1mm;
            font-weight: 500;
          }

          .t-fields {
            display: flex;
            align-items: flex-start;
            gap: 5mm;
            margin-top: 2.5mm;
            width: 100%;
            justify-content: center;
          }
          .t-sep   { width: 0.5px; background: #d4b896; align-self: stretch; margin: 1mm 0; }
          .t-field { display: flex; flex-direction: column; gap: 0.5mm; }
          .t-label { font-size: 5pt; letter-spacing: 0.18em; color: #8a6a3a; font-weight: 500; }
          .t-value { font-size: 7.5pt; color: #1c1810; font-weight: 600; }

          /* ── QR section ── */
          .t-qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
          }

          .t-divider {
            width: 100%;
            height: 0.5px;
            background: #e8d9c0;
            margin: 2mm 0;
          }

          .t-qr-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5mm;
          }
          .t-qr-img {
            width: 32mm;
            height: 32mm;
            display: block;
          }
          .t-qr-label {
            font-size: 5.5pt;
            letter-spacing: 0.22em;
            font-weight: 700;
            color: #c9a86c;
          }

          .t-upload-notice {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5mm;
            margin-top: 2mm;
            text-align: center;
          }
          .t-upload-primary {
            font-size: 6pt;
            color: #1c1810;
            letter-spacing: 0.02em;
          }
          .t-upload-primary strong { font-weight: 700; color: #8a6a3a; }
          .t-upload-secondary {
            font-size: 5pt;
            color: #a07840;
            font-style: italic;
          }

          /* ── Footer group ── */
          .t-footer {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5mm;
            width: 100%;
          }

          .t-message {
            font-size: 6.5pt;
            color: #3d2e1a;
            line-height: 1.5;
            font-style: italic;
            text-align: center;
            margin: 0;
          }

          .t-url {
            font-size: 4.5pt;
            color: #a07840;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.03em;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }
        }
      `}</style>
    </>
  )
}
