import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = 'admin@example.com' // set to the couple's or admin's address
const FROM_EMAIL = 'noreply@example.com' // must be a verified Resend sender

export async function sendPhotoUploadNotification(uploaderName: string, photoCount: number) {
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Photos Uploaded - ${uploaderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d9d78;">New Wedding Photos</h2>
          <p>Hello,</p>
          <p><strong>${uploaderName}</strong> has uploaded <strong>${photoCount}</strong> photo(s) to your wedding gallery.</p>
          <p>
            <a href="https://wedding-photo-platform.vercel.app/admin" style="background-color: #2d9d78; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
              View in Admin Dashboard
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This is an automated notification from your wedding photo gallery.
          </p>
        </div>
      `,
    })

    console.log('Photo upload notification sent:', response)
    return { success: true }
  } catch (error) {
    console.error('Failed to send photo upload notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendAdminWelcomeEmail() {
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: 'Welcome to Wedding Photo Gallery',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d9d78;">Welcome to Wedding Photo Gallery</h2>
          <p>Hello,</p>
          <p>Your wedding photo gallery is now live! Guests can share their favorite moments from your special day.</p>
          <h3>Quick Start Guide:</h3>
          <ul>
            <li>Share the gallery link or QR code with your guests</li>
            <li>Guests can upload photos directly from the gallery</li>
            <li>You can feature your favorite photos in the homepage carousel</li>
            <li>Download all photos or create guest-specific albums</li>
          </ul>
          <p>
            <a href="https://wedding-photo-platform.vercel.app/admin" style="background-color: #2d9d78; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
              Access Admin Dashboard
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Questions? Check the help documentation or contact support.
          </p>
        </div>
      `,
    })

    console.log('Welcome email sent:', response)
    return { success: true }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendGuestUploadConfirmation(uploaderName: string, photoCount: number, guestEmail?: string) {
  // Only send if guest email is provided
  if (!guestEmail) return { success: false, error: 'No guest email provided' }

  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: guestEmail,
      subject: 'Your Photos Have Been Uploaded',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d9d78;">Thanks for Sharing!</h2>
          <p>Hello ${uploaderName},</p>
          <p>We've received your <strong>${photoCount}</strong> photo(s) for the wedding gallery. Thank you for capturing these special moments!</p>
          <p>Your photos are now visible to other guests and will help us preserve these beautiful memories.</p>
          <p>
            <a href="https://wedding-photo-platform.vercel.app" style="background-color: #2d9d78; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
              View Gallery
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This is an automated confirmation from the Wedding Photo Gallery.
          </p>
        </div>
      `,
    })

    console.log('Guest confirmation email sent:', response)
    return { success: true }
  } catch (error) {
    console.error('Failed to send guest confirmation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
