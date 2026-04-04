/**
 * Test Supabase Connection
 *
 * Simple utility to verify Supabase is set up correctly
 */

import { supabase } from './client'

export async function testConnection() {
  try {
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('games')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return false
    }

    console.log('✅ Supabase connection successful!')
    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

export async function testRealtimeSetup() {
  try {
    // Test realtime subscription
    const channel = supabase
      .channel('test-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
        },
        (payload) => {
          console.log('✅ Realtime is working! Received:', payload)
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    // Clean up after 2 seconds
    setTimeout(() => {
      supabase.removeChannel(channel)
      console.log('✅ Realtime test complete')
    }, 2000)

    return true
  } catch (error) {
    console.error('❌ Realtime test failed:', error)
    return false
  }
}
