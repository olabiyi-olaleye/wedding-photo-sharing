import { createClient } from '@/lib/supabase/client'

/**
 * Compute SHA-256 hash of a file
 */
export async function computeFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Check if a file hash already exists in the database
 */
export async function checkDuplicateHash(fileHash: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('media')
    .select('id')
    .eq('file_hash', fileHash)
    .is('deleted_at', null)
    .limit(1)

  if (error) {
    console.error('Error checking duplicate:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * Check if a file is a duplicate and return warning message
 */
export async function detectDuplicate(file: File): Promise<{
  isDuplicate: boolean
  hash: string
  message?: string
}> {
  try {
    const hash = await computeFileHash(file)
    const isDuplicate = await checkDuplicateHash(hash)

    if (isDuplicate) {
      return {
        isDuplicate: true,
        hash,
        message: `This photo appears to be a duplicate. You can still upload it, but you may want to skip it.`,
      }
    }

    return { isDuplicate: false, hash }
  } catch (error) {
    console.error('Duplicate detection error:', error)
    return { isDuplicate: false, hash: '' }
  }
}
