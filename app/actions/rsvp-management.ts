'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/verify-admin'

export type RSVPStatus = 'pending' | 'accepted' | 'declined'

export interface Guest {
  id: string
  name: string
  email?: string | null
  rsvp_status: RSVPStatus
  uploaded: boolean
  uploaded_at?: string | null
}

/**
 * Get all guests with their RSVP and upload status
 */
export async function getGuestsWithStatus(): Promise<{ guests: Guest[]; error?: string }> {
  const isAdmin = await verifyAdminToken()
  if (!isAdmin) {
    return { guests: [], error: 'Unauthorized' }
  }

  try {
    const supabase = await createClient()

    // Get all guests
    const { data: guests, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .order('name')

    if (guestError) {
      return { guests: [], error: guestError.message }
    }

    if (!guests) {
      return { guests: [] }
    }

    // Get unique uploaders
    const { data: media } = await supabase
      .from('media')
      .select('uploaded_by, uploaded_at')
      .order('uploaded_at', { ascending: false })

    const uploaders = new Map<string, string>()
    media?.forEach((item) => {
      if (!uploaders.has(item.uploaded_by)) {
        uploaders.set(item.uploaded_by, item.uploaded_at)
      }
    })

    // Combine data
    const guestsWithStatus: Guest[] = guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      rsvp_status: guest.rsvp_status as RSVPStatus,
      uploaded: uploaders.has(guest.name),
      uploaded_at: uploaders.get(guest.name),
    }))

    return { guests: guestsWithStatus }
  } catch (error) {
    console.error('Error fetching guests:', error)
    return { guests: [], error: 'Failed to fetch guests' }
  }
}

/**
 * Update guest RSVP status
 */
export async function updateGuestRsvp(
  guestId: string,
  status: RSVPStatus
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdminToken()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('guests')
      .update({ rsvp_status: status })
      .eq('id', guestId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating RSVP:', error)
    return { success: false, error: 'Failed to update RSVP' }
  }
}

/**
 * Add a new guest
 */
export async function addGuest(
  name: string,
  email?: string
): Promise<{ success: boolean; error?: string; guestId?: string }> {
  const isAdmin = await verifyAdminToken()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('guests')
      .insert({ name, email, rsvp_status: 'pending' })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, guestId: data?.id }
  } catch (error) {
    console.error('Error adding guest:', error)
    return { success: false, error: 'Failed to add guest' }
  }
}

/**
 * Delete a guest
 */
export async function deleteGuest(guestId: string): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await verifyAdminToken()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('guests').delete().eq('id', guestId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting guest:', error)
    return { success: false, error: 'Failed to delete guest' }
  }
}

