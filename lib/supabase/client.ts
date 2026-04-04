/**
 * Supabase Client
 *
 * Singleton client for interacting with Supabase
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using anonymous/guest access
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limiting for realtime updates
    },
  },
})
