import { cookies } from 'next/headers'

export async function POST() {
  const cookieJar = await cookies()
  cookieJar.delete('admin_token')
  return Response.json({ success: true })
}
