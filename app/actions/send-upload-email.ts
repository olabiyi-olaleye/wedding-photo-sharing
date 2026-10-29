'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const COUPLE_EMAIL = process.env.COUPLE_EMAIL || ''

export async function sendUploadNotification(
  guestName: string,
  photoCount: number,
  guestId: string
): Promise<{ success: boolean; error?: string }> {
  if (!COUPLE_EMAIL || !process.env.RESEND_API_KEY) {
    console.warn('Email notifications not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://wedding-photo-platform.vercel.app'
    const guestLink = `${baseUrl}/guest/${guestId}`

    await resend.emails.send({
      from: 'noreply@resend.dev',
      to: COUPLE_EMAIL,
      subject: `${guestName} shared ${photoCount} photo${photoCount > 1 ? 's' : ''} from your wedding`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">New photos from ${guestName}!</h2>
          <p style="color: #666; font-size: 16px;">
            ${guestName} just uploaded <strong>${photoCount} photo${photoCount > 1 ? 's' : ''}</strong> from your wedding.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${guestLink}" style="
              background-color: #2d9d78;
              color: white;
              padding: 12px 32px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
              font-weight: bold;
            ">View ${guestName}'s Album</a>
          </div>

          <p style="color: #999; font-size: 14px;">
            You received this email because you are the couple for this wedding photo gallery.
          </p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send upload email:', error)
    return { success: false, error: 'Failed to send email notification' }
  }
}
