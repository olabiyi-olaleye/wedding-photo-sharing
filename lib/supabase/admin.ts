import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { verifyAdminToken } from "@/lib/verify-admin"

// Service-role client — bypasses RLS. Only call from server actions / route
// handlers that have already verified the admin token via verifyAdminToken().
export async function createAdminClient() {
  const isAdmin = await verifyAdminToken()
  if (!isAdmin) {
    throw new Error("Unauthorized: admin token required")
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Internal — use only when the caller has already verified admin access
// through a mechanism other than verifyAdminToken (e.g. the ZIP route which
// reads and verifies the token manually before calling this).
export function createAdminClientUnchecked() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
