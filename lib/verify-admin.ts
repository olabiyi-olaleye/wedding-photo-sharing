import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this')

// Tokens issued before the current deployment epoch are rejected even if
// cryptographically valid — redeploy to instantly revoke all active sessions.
const DEPLOYED_AT = process.env.DEPLOYED_AT
  ? Math.floor(new Date(process.env.DEPLOYED_AT).getTime() / 1000)
  : 0

export async function verifyAdminToken(): Promise<boolean> {
  try {
    const cookieJar = await cookies()
    const token = cookieJar.get('admin_token')?.value

    if (!token) return false

    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Reject tokens stamped with a deployedAt earlier than the current deploy
    if (DEPLOYED_AT && typeof payload.deployedAt === 'number' && payload.deployedAt < DEPLOYED_AT) {
      return false
    }

    return true
  } catch {
    return false
  }
}
