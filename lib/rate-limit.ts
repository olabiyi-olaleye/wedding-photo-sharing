import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const isProduction = process.env.NODE_ENV === 'production'

const hasUpstashConfig =
  process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://') &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

let ratelimit: Ratelimit | null = null
let adminRatelimit: Ratelimit | null = null

if (hasUpstashConfig) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  ratelimit = new Ratelimit({
    redis,
    analytics: false,
    prefix: 'upload-rate-limit',
    limiter: Ratelimit.slidingWindow(60, '1 h'),
  })

  adminRatelimit = new Ratelimit({
    redis,
    analytics: false,
    prefix: 'admin-auth-rate-limit',
    limiter: Ratelimit.slidingWindow(5, '15 m'),
  })
}

// Development-only in-memory fallback (single process, no concurrency concerns)
const inMemoryLimits = new Map<string, { count: number; resetTime: number }>()
const inMemoryAdminLimits = new Map<string, { count: number; resetTime: number }>()

export async function checkUploadRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetTime?: number }> {
  // Guard at request-time so the build succeeds without Upstash env vars.
  if (isProduction && !ratelimit) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production. ' +
      'The in-memory fallback does not work across serverless instances.'
    )
  }

  if (ratelimit) {
    try {
      const { success, remaining, reset } = await ratelimit.limit(ip)
      return { allowed: success, remaining: Math.max(0, remaining), resetTime: reset }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Fail closed in production — do not allow if Redis is unreachable
      if (isProduction) return { allowed: false, remaining: 0 }
      return { allowed: true, remaining: 60 }
    }
  }

  // In-memory fallback — development only
  const now = Date.now()
  const hourMs = 60 * 60 * 1000
  const userLimit = inMemoryLimits.get(ip)

  if (userLimit && now < userLimit.resetTime) {
    const remaining = Math.max(0, 60 - userLimit.count)
    return { allowed: remaining > 0, remaining, resetTime: userLimit.resetTime }
  }

  inMemoryLimits.set(ip, { count: 1, resetTime: now + hourMs })
  return { allowed: true, remaining: 59, resetTime: now + hourMs }
}

export async function checkAdminRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (adminRatelimit) {
    try {
      const { success, remaining } = await adminRatelimit.limit(ip)
      return { allowed: success, remaining: Math.max(0, remaining) }
    } catch (error) {
      console.error('Admin rate limit check failed:', error)
      if (isProduction) return { allowed: false, remaining: 0 }
      return { allowed: true, remaining: 5 }
    }
  }

  // In-memory fallback — development only (5 attempts per 15 min)
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const entry = inMemoryAdminLimits.get(ip)

  if (entry && now < entry.resetTime) {
    if (entry.count >= 5) return { allowed: false, remaining: 0 }
    inMemoryAdminLimits.set(ip, { count: entry.count + 1, resetTime: entry.resetTime })
    return { allowed: true, remaining: 5 - entry.count - 1 }
  }

  inMemoryAdminLimits.set(ip, { count: 1, resetTime: now + windowMs })
  return { allowed: true, remaining: 4 }
}
