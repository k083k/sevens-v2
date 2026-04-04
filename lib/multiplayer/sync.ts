/**
 * State Synchronization
 *
 * Functions for syncing game state with Supabase
 */

import { supabase } from '../supabase/client'
import { GameState, ICard, IPlayer, PlayerType } from '../game/types/types'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { Card } from '../game/models/Card'

/**
 * Reconstruct Card instances from plain objects
 */
export function reconstructCard(cardData: ICard): Card {
  return new Card(cardData.suit, cardData.rank)
}

/**
 * Reconstruct hand of Card instances from plain objects
 */
export function reconstructHand(handData: ICard[]): Card[] {
  return handData.map(reconstructCard)
}

/**
 * Serializable game state for database storage
 */
export interface SerializableGameState {
  players: Array<{
    id: string
    name: string
    type: PlayerType
    seatPosition: number
    handSize: number
    hand: ICard[] // Store ALL hands for proper initialization
    finishPosition: number | null
  }>
  board: GameState['board']
  currentPlayerIndex: number
  turnOrder: string[]
  gamePhase: GameState['gamePhase']
  gameMode: GameState['gameMode']
  rankings: string[]
  pendingCardTransfer: GameState['pendingCardTransfer']
}

/**
 * Serialize game state for storage
 * Store all player hands for proper game initialization
 */
export function serializeGameState(
  state: GameState,
  currentPlayerId: string
): SerializableGameState {
  return {
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      type: player.type,
      seatPosition: player.seatPosition,
      handSize: player.getHandSize(),
      hand: Array.from(player.getHand()), // Store all hands
      finishPosition: player.finishPosition,
    })),
    board: state.board,
    currentPlayerIndex: state.currentPlayerIndex,
    turnOrder: Array.from(state.turnOrder),
    gamePhase: state.gamePhase,
    gameMode: state.gameMode,
    rankings: Array.from(state.rankings),
    pendingCardTransfer: state.pendingCardTransfer,
  }
}

/**
 * Save game state to Supabase
 */
export async function saveGameState(
  gameId: string,
  state: GameState,
  currentPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const serialized = serializeGameState(state, currentPlayerId)

    const { error } = await supabase
      .from('game_state')
      .upsert({
        game_id: gameId,
        state: serialized as any,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error saving game state:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error saving game state:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Load game state from Supabase
 */
export async function loadGameState(
  gameId: string
): Promise<{ success: boolean; state?: SerializableGameState; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('game_state')
      .select('state')
      .eq('game_id', gameId)
      .single()

    if (error) {
      console.error('Error loading game state:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Game state not found' }
    }

    return { success: true, state: data.state as SerializableGameState }
  } catch (error: any) {
    console.error('Error loading game state:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Record a move in the database
 */
export async function recordMove(
  gameId: string,
  playerId: string,
  moveType: 'play_card' | 'cannot_play' | 'transfer_card',
  moveData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('game_moves').insert({
      game_id: gameId,
      player_id: playerId,
      move_type: moveType,
      move_data: moveData,
    })

    if (error) {
      console.error('Error recording move:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error recording move:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to game state updates
 */
export function subscribeToGameState(
  gameId: string,
  callback: (state: SerializableGameState) => void
): RealtimeChannel {
  const channelName = `game_state:${gameId}`

  // Remove any existing channel with this name first
  const existingChannel = supabase.channel(channelName)
  if (existingChannel) {
    supabase.removeChannel(existingChannel)
  }

  // Create new channel
  const channel = supabase.channel(channelName)

  // Add listener BEFORE subscribing
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'game_state',
      filter: `game_id=eq.${gameId}`,
    },
    (payload) => {
      const state = payload.new.state as SerializableGameState
      callback(state)
    }
  )

  // Subscribe AFTER adding listeners
  channel.subscribe()

  return channel
}

/**
 * Unsubscribe from game state updates
 */
export function unsubscribeFromGameState(channel: RealtimeChannel) {
  supabase.removeChannel(channel)
}

/**
 * Initialize game state in database
 */
export async function initializeGameState(
  gameId: string,
  initialState: GameState,
  hostPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const serialized = serializeGameState(initialState, hostPlayerId)

    console.log('Initializing game state for gameId:', gameId)
    console.log('Serialized state:', JSON.stringify(serialized).substring(0, 200))

    // Use UPSERT instead of INSERT to avoid duplicate key errors
    const { data, error } = await supabase.from('game_state').upsert({
      game_id: gameId,
      state: serialized as any,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'game_id' // Update if game_id already exists
    }).select()

    if (error) {
      console.error('Error initializing game state:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { success: false, error: `${error.message} (${error.code})` }
    }

    console.log('Game state initialized, result:', data)
    return { success: true }
  } catch (error: any) {
    console.error('Exception initializing game state:', error)
    return { success: false, error: error.message || String(error) }
  }
}

/**
 * Get full move history for a game
 */
export async function getMoveHistory(gameId: string) {
  try {
    const { data, error } = await supabase
      .from('game_moves')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching move history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching move history:', error)
    return []
  }
}

/**
 * Mark game as finished
 */
export async function finishGame(gameId: string) {
  try {
    const { error } = await supabase
      .from('games')
      .update({
        status: 'finished',
        finished_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    if (error) {
      console.error('Error finishing game:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error finishing game:', error)
    return { success: false, error: error.message }
  }
}
