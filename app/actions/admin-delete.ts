'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // createAdminClient() verifies the admin token internally — throws if unauthorized
    const supabase = await createAdminClient()

    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .single()

    if (fetchError || !media) {
      return { success: false, error: 'Media not found' }
    }

    // Log admin action before mutating (non-fatal — table may not exist during migration)
    await supabase.from('audit_logs').insert({
      action: 'admin_delete',
      media_id: mediaId,
      metadata: { uploaded_by: media.uploaded_by, file_url: media.file_url },
    }).then(() => {}, () => {})

    // Soft-delete: set deleted_at timestamp — hidden from gallery but recoverable.
    // Hard purge can be done from Supabase dashboard if truly needed.
    const { error: deleteError } = await supabase
      .from('media')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', mediaId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('Delete error:', error)
    return { success: false, error: 'Failed to delete media' }
  }
}
