import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET_KEY = process.env.JWT_SECRET
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY || '')

const DEPLOYED_AT = process.env.DEPLOYED_AT
  ? Math.floor(new Date(process.env.DEPLOYED_AT).getTime() / 1000)
  : 0

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      if (!JWT_SECRET_KEY) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      const { payload } = await jwtVerify(token, JWT_SECRET)

      if (DEPLOYED_AT && typeof payload.deployedAt === 'number' && payload.deployedAt < DEPLOYED_AT) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      return NextResponse.next()
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
