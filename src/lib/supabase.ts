import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

console.log('[Supabase] URL:', url)
console.log('[Supabase] Key present:', !!key)
console.log('[Supabase] URL type:', typeof url)
console.log('[Supabase] URL length:', url?.length)

if (!url || !key) {
  throw new Error(`Supabase env vars missing. URL: ${!!url}, Key: ${!!key}`)
}

export const supabase = createClient(url, key)
