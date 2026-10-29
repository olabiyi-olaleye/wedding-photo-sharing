import { checkUploadRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

// Matches crypto.randomUUID() output — the format getOrCreateGuestToken() generates.
const GUEST_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const headersList = await headers()
  // x-vercel-forwarded-for is set by Vercel infrastructure and cannot be spoofed
  // by the client. Fall back to x-forwarded-for only in local dev.
  const ip =
    headersList.get('x-vercel-forwarded-for') ||
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  // Key by guest token when available so guests sharing one venue/WiFi IP
  // don't share a single 60/hour budget. Falls back to IP if the client
  // didn't send a token (e.g. localStorage blocked).
  let guestToken: string | undefined
  try {
    const body = await request.json()
    if (typeof body?.guestToken === 'string' && GUEST_TOKEN_PATTERN.test(body.guestToken)) {
      guestToken = body.guestToken
    }
  } catch {
    // No/invalid JSON body — fall back to IP keying below.
  }

  const rateLimitKey = guestToken ? `guest:${guestToken}` : `ip:${ip}`
  const { allowed, remaining, resetTime } = await checkUploadRateLimit(rateLimitKey)

  if (!allowed) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        message: 'You have reached the maximum number of uploads per hour (60 files). Please try again later.',
        resetTime,
      },
      { status: 429 }
    )
  }

  return Response.json({ allowed: true, remaining, resetTime })
}
