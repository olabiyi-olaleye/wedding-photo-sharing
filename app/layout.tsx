import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { MediaProvider } from '@/lib/media-context'
import { Toaster } from 'sonner'
import { siteConfig } from '@/lib/site-config'
import './globals.css'

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif"
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: `${siteConfig.weddingName} - Photo Gallery | Share Wedding Memories`,
  description: `Share and view beautiful wedding photos from ${siteConfig.weddingName}. Upload your favorite moments and contribute to our wedding photo gallery.`,
  keywords: 'wedding photos, photo gallery, wedding memories, photo sharing',
  manifest: '/manifest.json',
  metadataBase: new URL(siteConfig.url),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: `${siteConfig.weddingName} Photo`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: `${siteConfig.weddingName} - Photo Gallery`,
    description: `Share and view beautiful wedding photos from ${siteConfig.weddingName}`,
    siteName: `${siteConfig.weddingName} Photo Gallery`,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.weddingName} Photo Gallery`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.weddingName} - Photo Gallery`,
    description: `Share and view beautiful wedding photos from ${siteConfig.weddingName}`,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#b08040',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <MediaProvider>
            {children}
          </MediaProvider>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
