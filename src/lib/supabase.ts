import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL) as string
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) as string

console.log('[Supabase] Initializing with URL:', url?.substring(0, 30) + '...')

if (!url?.trim() || !key?.trim()) {
  throw new Error('Supabase environment variables not configured')
}

export const supabase = createClient(url.trim(), key.trim())
