import { cookies, headers } from 'next/headers'
import { SignJWT } from 'jose'
import { checkAdminRateLimit } from '@/lib/rate-limit'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const JWT_SECRET_KEY = process.env.JWT_SECRET

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY || '')

export async function POST(request: Request) {
  const headersList = await headers()
  const ip =
    headersList.get('x-vercel-forwarded-for') ??
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ??
    '127.0.0.1'

  const { allowed } = await checkAdminRateLimit(ip)
  if (!allowed) {
    return Response.json(
      { error: 'Too many login attempts. Please wait 15 minutes.' },
      { status: 429 }
    )
  }

  const { password } = await request.json()

  // Check if env vars are properly set
  if (!ADMIN_PASSWORD || !JWT_SECRET_KEY) {
    return Response.json(
      { error: 'Server configuration error. Please check environment variables.' },
      { status: 500 }
    )
  }

  // Validate password against server-side env var (never exposed to client)
  if (!password || password !== ADMIN_PASSWORD) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }

  // DEPLOYED_AT is set at build time; tokens issued before the last deploy are
  // automatically invalid, giving instant revocation on redeployment.
  const deployedAt = Math.floor(
    new Date(process.env.DEPLOYED_AT || Date.now()).getTime() / 1000
  )

  const token = await new SignJWT({
    role: 'admin',
    deployedAt,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)

  // Set httpOnly cookie with the token
  const cookieJar = await cookies()
  cookieJar.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  })

  return Response.json({ success: true })
}
