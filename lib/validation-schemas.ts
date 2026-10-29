import { z } from 'zod'

/**
 * Validation schemas for all user inputs
 * Zod is used for runtime validation to catch invalid data early
 */

// Guest upload metadata validation
export const uploadFormSchema = z.object({
  uploaderName: z
    .string()
    .min(1, 'Please enter your name')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  guestTag: z
    .string()
    .max(50, 'Tag must be less than 50 characters')
    .optional()
    .nullable(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
})

export type UploadFormInput = z.infer<typeof uploadFormSchema>

// Admin password validation
export const adminLoginSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .max(200, 'Password too long'),
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>

// Sanitization function for user-provided strings
export function sanitizeInput(input: string, maxLength: number = 200): string {
  if (typeof input !== 'string') return ''

  // Remove any HTML/script tags
  const sanitized = input
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()

  // Limit length
  return sanitized.substring(0, maxLength)
}

// Validate and sanitize guest uploader name
export function validateUploaderName(name: string): { valid: boolean; error?: string; sanitized?: string } {
  try {
    const validated = uploadFormSchema.pick({ uploaderName: true }).parse({
      uploaderName: name,
    })
    return { valid: true, sanitized: sanitizeInput(validated.uploaderName) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message }
    }
    return { valid: false, error: 'Invalid input' }
  }
}

// Validate and sanitize guest tag
export function validateGuestTag(tag: string | null | undefined): { valid: boolean; error?: string; sanitized?: string | null } {
  if (!tag) return { valid: true, sanitized: null }

  try {
    const validated = uploadFormSchema.pick({ guestTag: true }).parse({
      guestTag: tag,
    })
    return { valid: true, sanitized: validated.guestTag ? sanitizeInput(validated.guestTag, 50) : null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message }
    }
    return { valid: false, error: 'Invalid tag' }
  }
}

// Validate admin login password
export function validateAdminPassword(password: string): { valid: boolean; error?: string } {
  try {
    adminLoginSchema.parse({ password })
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message }
    }
    return { valid: false, error: 'Invalid password' }
  }
}
