import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string)?.trim()
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim()

if (!url || !key) {
  console.error('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
  console.error('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '***PRESENT***' : 'MISSING')
  throw new Error('Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes dans .env.local')
}

export const supabase = createClient(url, key)
