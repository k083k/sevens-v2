/**
 * Database Types
 *
 * TypeScript types for Supabase database schema
 */

import { GameState } from '../game/types/types'

export type GameStatus = 'waiting' | 'playing' | 'finished' | 'cancelled'
export type GameModeDb = 'easy' | 'hard'
export type MoveType = 'play_card' | 'cannot_play' | 'transfer_card'

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          code: string
          host_id: string
          status: GameStatus
          mode: GameModeDb
          max_players: number
          created_at: string
          started_at: string | null
          finished_at: string | null
        }
        Insert: {
          id?: string
          code: string
          host_id: string
          status: GameStatus
          mode: GameModeDb
          max_players?: number
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          host_id?: string
          status?: GameStatus
          mode?: GameModeDb
          max_players?: number
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
        }
      }
      game_players: {
        Row: {
          id: string
          game_id: string
          player_id: string
          player_name: string
          seat_position: number
          is_host: boolean
          connected: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          player_name: string
          seat_position: number
          is_host?: boolean
          connected?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          player_name?: string
          seat_position?: number
          is_host?: boolean
          connected?: boolean
          joined_at?: string
        }
      }
      game_state: {
        Row: {
          game_id: string
          state: GameState
          updated_at: string
        }
        Insert: {
          game_id: string
          state: GameState
          updated_at?: string
        }
        Update: {
          game_id?: string
          state?: GameState
          updated_at?: string
        }
      }
      game_moves: {
        Row: {
          id: string
          game_id: string
          player_id: string
          move_type: MoveType
          move_data: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          move_type: MoveType
          move_data: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          move_type?: MoveType
          move_data?: Record<string, any>
          created_at?: string
        }
      }
    }
  }
}
