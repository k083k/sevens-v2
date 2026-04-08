'use server'

/**
 * Server Actions — Lobby
 *
 * All multiplayer lobby operations (create, join, start, leave, cancel).
 * These run on the server so the client never writes to the database directly.
 */

import { supabaseServer } from '../supabase/server'
import { generateGameCode, validateGameCode, normalizeGameCode } from '../multiplayer/gameCode'
import type { GameStatus, GameModeDb } from '../supabase/types'

// ─── Result types ────────────────────────────────────────────────────────────

export type ActionResult<T = undefined> = T extends undefined
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string }

interface CreateGameData {
  gameId: string
  gameCode: string
  playerId: string
}

interface JoinGameData {
  gameId: string
  playerId: string
}

// ─── Create Game ─────────────────────────────────────────────────────────────

export async function createGame(
  hostName: string,
  mode: 'easy' | 'hard',
  maxPlayers: number = 4
): Promise<ActionResult<CreateGameData>> {
  try {
    // Generate unique game code (retry up to 5 times)
    let gameCode = generateGameCode()
    let codeExists = true
    let attempts = 0

    while (codeExists && attempts < 5) {
      const { data } = await supabaseServer
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

    const hostPlayerId = crypto.randomUUID()

    // Create game record
    const { data: game, error: gameError } = await (supabaseServer
      .from('games') as any)
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
      return { success: false, error: gameError?.message || 'Failed to create game' }
    }

    // Add host as first player
    const { error: playerError } = await (supabaseServer
      .from('game_players') as any)
      .insert({
        game_id: (game as any).id,
        player_id: hostPlayerId,
        player_name: hostName,
        seat_position: 0,
        is_host: true,
        connected: true,
      })

    if (playerError) {
      // Clean up game if player creation failed
      await (supabaseServer.from('games') as any).delete().eq('id', (game as any).id)
      return { success: false, error: playerError.message }
    }

    return {
      success: true,
      data: {
        gameId: (game as any).id,
        gameCode,
        playerId: hostPlayerId,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unexpected error creating game' }
  }
}

// ─── Join Game ───────────────────────────────────────────────────────────────

export async function joinGame(
  gameCode: string,
  playerName: string
): Promise<ActionResult<JoinGameData>> {
  try {
    const normalizedCode = normalizeGameCode(gameCode)
    if (!validateGameCode(normalizedCode)) {
      return { success: false, error: 'Invalid game code format' }
    }

    // Find game
    const { data: game, error: gameError } = await (supabaseServer
      .from('games') as any)
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (gameError || !game) {
      return { success: false, error: 'Game not found' }
    }

    if ((game as any).status !== 'waiting') {
      return { success: false, error: 'Game has already started or ended' }
    }

    // Check player count
    const { data: existingPlayers, error: playersError } = await (supabaseServer
      .from('game_players') as any)
      .select('*')
      .eq('game_id', (game as any).id)

    if (playersError) {
      return { success: false, error: 'Failed to check player count' }
    }

    if (existingPlayers.length >= (game as any).max_players) {
      return { success: false, error: 'Game is full' }
    }

    // Find available seat
    const takenSeats = new Set(existingPlayers.map((p: any) => p.seat_position))
    let seatPosition = 0
    while (takenSeats.has(seatPosition) && seatPosition < 4) {
      seatPosition++
    }

    const playerId = crypto.randomUUID()

    // Add player
    const { error: insertError } = await (supabaseServer
      .from('game_players') as any)
      .insert({
        game_id: (game as any).id,
        player_id: playerId,
        player_name: playerName,
        seat_position: seatPosition,
        is_host: false,
        connected: true,
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return {
      success: true,
      data: {
        gameId: (game as any).id,
        playerId,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unexpected error joining game' }
  }
}

// ─── Start Game ──────────────────────────────────────────────────────────────

export async function startGame(
  gameId: string,
  hostPlayerId: string
): Promise<ActionResult> {
  try {
    // Verify host
    const { data: player } = await (supabaseServer
      .from('game_players') as any)
      .select('is_host')
      .eq('game_id', gameId)
      .eq('player_id', hostPlayerId)
      .single()

    if (!(player as any)?.is_host) {
      return { success: false, error: 'Only the host can start the game' }
    }

    // Check player count
    const { data: players } = await (supabaseServer
      .from('game_players') as any)
      .select('*')
      .eq('game_id', gameId)

    if (!players || players.length < 2) {
      return { success: false, error: 'Need at least 2 players to start' }
    }

    // Update game status
    const { error } = await (supabaseServer
      .from('games') as any)
      .update({
        status: 'playing' as GameStatus,
        started_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unexpected error starting game' }
  }
}

// ─── Leave Game ──────────────────────────────────────────────────────────────

export async function leaveGame(
  gameId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    const { error } = await (supabaseServer
      .from('game_players') as any)
      .delete()
      .eq('game_id', gameId)
      .eq('player_id', playerId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unexpected error leaving game' }
  }
}

// ─── Cancel Game ─────────────────────────────────────────────────────────────

export async function cancelGame(
  gameId: string,
  hostPlayerId: string
): Promise<ActionResult> {
  try {
    // Verify host
    const { data: player } = await (supabaseServer
      .from('game_players') as any)
      .select('is_host')
      .eq('game_id', gameId)
      .eq('player_id', hostPlayerId)
      .single()

    if (!(player as any)?.is_host) {
      return { success: false, error: 'Only the host can cancel the game' }
    }

    const { error } = await (supabaseServer
      .from('games') as any)
      .update({
        status: 'cancelled' as GameStatus,
        finished_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unexpected error cancelling game' }
  }
}

// ─── Get Game Players (read-only, but server-side) ───────────────────────────

export async function getGamePlayers(gameId: string) {
  const { data: players, error } = await (supabaseServer
    .from('game_players') as any)
    .select('*')
    .eq('game_id', gameId)
    .order('seat_position')

  if (error) {
    return []
  }

  return players || []
}

// ─── Get Game By Code (read-only, but server-side) ───────────────────────────

export async function getGameByCode(gameCode: string) {
  const normalizedCode = normalizeGameCode(gameCode)

  const { data: game, error } = await (supabaseServer
    .from('games') as any)
    .select('*')
    .eq('code', normalizedCode)
    .single()

  if (error) {
    return null
  }

  return game
}
