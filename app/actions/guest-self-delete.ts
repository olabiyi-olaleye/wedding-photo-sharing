'use server'

import { createAdminClientUnchecked } from '@/lib/supabase/admin'

export async function guestSelfDeleteMedia(
  mediaId: string,
  guestId: string,
  uploadedAt: string,
  sessionToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const uploadTime = new Date(uploadedAt).getTime()
    const diffMs = Date.now() - uploadTime
    const DELETE_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

    if (diffMs > DELETE_WINDOW_MS) {
      return { success: false, error: 'Delete window has expired (24 hours)' }
    }

    const supabase = createAdminClientUnchecked()

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isToken = UUID_RE.test(guestId)

    // Verify the media belongs to this guest — match by token (new) or name (legacy)
    const query = supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .is('deleted_at', null)

    const { data: media, error: fetchError } = await (
      isToken
        ? query.eq('guest_token', guestId)
        : query.eq('uploaded_by', guestId)
    ).single()

    if (fetchError || !media) {
      return { success: false, error: 'Media not found' }
    }

    // Session token check: if the media has a guest_token, the caller must supply
    // the matching token from their localStorage. This blocks cross-guest deletion
    // — an attacker who knows a victim's name cannot delete their photos without
    // also having the random UUID stored only in the victim's browser.
    if (media.guest_token) {
      if (!sessionToken || sessionToken !== media.guest_token) {
        return { success: false, error: 'You can only delete photos uploaded from your own device' }
      }
    }

    // Soft-delete: set deleted_at — hidden from gallery but recoverable by admin.
    const { error: deleteError } = await supabase
      .from('media')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', mediaId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Guest self-delete error:', error)
    return { success: false, error: 'Failed to delete media' }
  }
}
