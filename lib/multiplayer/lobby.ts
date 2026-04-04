/**
 * Lobby Management
 *
 * Functions for creating and joining multiplayer games
 */

import { supabase } from '../supabase/client'
import { generateGameCode, validateGameCode, normalizeGameCode } from './gameCode'
import type { GameStatus, GameModeDb } from '../supabase/types'

export interface CreateGameOptions {
  hostName: string
  mode: 'easy' | 'hard'
  maxPlayers?: number
}

export interface CreateGameResult {
  success: boolean
  gameId?: string
  gameCode?: string
  playerId?: string
  error?: string
}

export interface JoinGameOptions {
  gameCode: string
  playerName: string
}

export interface JoinGameResult {
  success: boolean
  gameId?: string
  playerId?: string
  error?: string
}

/**
 * Create a new multiplayer game
 */
export async function createGame(options: CreateGameOptions): Promise<CreateGameResult> {
  try {
    const { hostName, mode, maxPlayers = 4 } = options

    // Generate unique game code
    let gameCode = generateGameCode()
    let attempts = 0
    let codeExists = true

    // Ensure code is unique (max 5 attempts)
    while (codeExists && attempts < 5) {
      const { data } = await supabase
        .from('games')
        .select('code')
        .eq('code', gameCode)
        .single()

      if (!data) {
        codeExists = false
      } else {
        gameCode = generateGameCode()
        attempts++
      }
    }

    if (codeExists) {
      return { success: false, error: 'Failed to generate unique game code' }
    }

    // Generate host player ID
    const hostPlayerId = crypto.randomUUID()

    // Create game record
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        code: gameCode,
        host_id: hostPlayerId,
        status: 'waiting' as GameStatus,
        mode: mode as GameModeDb,
        max_players: maxPlayers,
      })
      .select()
      .single()

    if (gameError || !game) {
      console.error('Error creating game:', gameError)
      return { success: false, error: gameError?.message || 'Failed to create game' }
    }

    // Add host as first player
    const { error: playerError } = await supabase
      .from('game_players')
      .insert({
        game_id: game.id,
        player_id: hostPlayerId,
        player_name: hostName,
        seat_position: 0,
        is_host: true,
        connected: true,
      })

    if (playerError) {
      console.error('Error adding host player:', playerError)
      // Clean up game if player creation failed
      await supabase.from('games').delete().eq('id', game.id)
      return { success: false, error: playerError.message }
    }

    return {
      success: true,
      gameId: game.id,
      gameCode: gameCode,
      playerId: hostPlayerId,
    }
  } catch (error: any) {
    console.error('Unexpected error creating game:', error)
    return { success: false, error: error.message || 'Unexpected error' }
  }
}

/**
 * Join an existing game using a game code
 */
export async function joinGame(options: JoinGameOptions): Promise<JoinGameResult> {
  try {
    const { gameCode, playerName } = options

    // Validate and normalize code
    const normalizedCode = normalizeGameCode(gameCode)
    if (!validateGameCode(normalizedCode)) {
      return { success: false, error: 'Invalid game code format' }
    }

    // Find game by code
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (gameError || !game) {
      return { success: false, error: 'Game not found' }
    }

    // Check game status
    if (game.status !== 'waiting') {
      return { success: false, error: 'Game has already started or ended' }
    }

    // Check player count
    const { data: existingPlayers, error: playersError } = await supabase
      .from('game_players')
      .select('*')
      .eq('game_id', game.id)

    if (playersError) {
      return { success: false, error: 'Failed to check player count' }
    }

    if (existingPlayers.length >= game.max_players) {
      return { success: false, error: 'Game is full' }
    }

    // Find available seat position
    const takenSeats = new Set(existingPlayers.map((p) => p.seat_position))
    let seatPosition = 0
    while (takenSeats.has(seatPosition) && seatPosition < 4) {
      seatPosition++
    }

    // Generate player ID
    const playerId = crypto.randomUUID()

    // Add player to game
    const { error: insertError } = await supabase
      .from('game_players')
      .insert({
        game_id: game.id,
        player_id: playerId,
        player_name: playerName,
        seat_position: seatPosition,
        is_host: false,
        connected: true,
      })

    if (insertError) {
      console.error('Error joining game:', insertError)
      return { success: false, error: insertError.message }
    }

    return {
      success: true,
      gameId: game.id,
      playerId: playerId,
    }
  } catch (error: any) {
    console.error('Unexpected error joining game:', error)
    return { success: false, error: error.message || 'Unexpected error' }
  }
}

/**
 * Get game info by code
 */
export async function getGameByCode(gameCode: string) {
  const normalizedCode = normalizeGameCode(gameCode)

  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('code', normalizedCode)
    .single()

  if (error) {
    return null
  }

  return game
}

/**
 * Get players in a game
 */
export async function getGamePlayers(gameId: string) {
  const { data: players, error } = await supabase
    .from('game_players')
    .select('*')
    .eq('game_id', gameId)
    .order('seat_position')

  if (error) {
    console.error('Error fetching players:', error)
    return []
  }

  return players || []
}

/**
 * Leave a game
 */
export async function leaveGame(gameId: string, playerId: string) {
  const { error } = await supabase
    .from('game_players')
    .delete()
    .eq('game_id', gameId)
    .eq('player_id', playerId)

  if (error) {
    console.error('Error leaving game:', error)
    return false
  }

  return true
}

/**
 * Start a game (host only)
 */
export async function startGame(gameId: string, hostPlayerId: string) {
  // Verify host
  const { data: player } = await supabase
    .from('game_players')
    .select('is_host')
    .eq('game_id', gameId)
    .eq('player_id', hostPlayerId)
    .single()

  if (!player?.is_host) {
    return { success: false, error: 'Only the host can start the game' }
  }

  // Check player count (need at least 2)
  const { data: players } = await supabase
    .from('game_players')
    .select('*')
    .eq('game_id', gameId)

  if (!players || players.length < 2) {
    return { success: false, error: 'Need at least 2 players to start' }
  }

  // Update game status
  const { error } = await supabase
    .from('games')
    .update({
      status: 'playing' as GameStatus,
      started_at: new Date().toISOString(),
    })
    .eq('id', gameId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Cancel/end a game (host only)
 */
export async function cancelGame(gameId: string, hostPlayerId: string) {
  // Verify host
  const { data: player } = await supabase
    .from('game_players')
    .select('is_host')
    .eq('game_id', gameId)
    .eq('player_id', hostPlayerId)
    .single()

  if (!player?.is_host) {
    return { success: false, error: 'Only the host can cancel the game' }
  }

  // Update game status to cancelled
  const { error } = await supabase
    .from('games')
    .update({
      status: 'cancelled' as GameStatus,
      finished_at: new Date().toISOString(),
    })
    .eq('id', gameId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
