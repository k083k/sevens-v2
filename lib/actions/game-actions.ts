'use server'

/**
 * Server Actions — Game Mutations
 *
 * All game state mutations (play card, cannot play, card transfer, initialize).
 * The GameEngine validates every move server-side before writing to the database,
 * so a malicious client can't push invalid state.
 */

import { supabaseServer } from '../supabase/server'
import { Game } from '../game/Game'
import { Board } from '../game/models/Board'
import { GameEngine } from '../game/engine/GameEngine'
import { Card } from '../game/models/Card'
import { HumanPlayer } from '../game/models/Player'
import {
  GameMode,
  GamePhase,
  PlayerType,
  Suit,
  ICard,
  Rank,
} from '../game/types/types'
import type { SerializableGameState } from '../multiplayer/sync'
import type { ActionResult } from './lobby-actions'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Load and parse game state from the database.
 */
async function loadState(gameId: string): Promise<SerializableGameState | null> {
  const { data, error } = await (supabaseServer
    .from('game_state') as any)
    .select('state')
    .eq('game_id', gameId)
    .single()

  if (error || !data) return null
  return (data as any).state as SerializableGameState
}

/**
 * Save game state to the database.
 */
async function saveState(
  gameId: string,
  state: SerializableGameState
): Promise<boolean> {
  const { error } = await (supabaseServer
    .from('game_state') as any)
    .upsert({
      game_id: gameId,
      state,
      updated_at: new Date().toISOString(),
    })

  return !error
}

/**
 * Record a move in the game_moves history table.
 */
async function recordMove(
  gameId: string,
  playerId: string,
  moveType: 'play_card' | 'cannot_play' | 'transfer_card',
  moveData: Record<string, any>
): Promise<void> {
  await (supabaseServer.from('game_moves') as any).insert({
    game_id: gameId,
    player_id: playerId,
    move_type: moveType,
    move_data: moveData,
  })
}

/**
 * Reconstruct a Board instance from serialized board state,
 * and a GameEngine on top of it — used for server-side validation.
 */
function buildEngine(state: SerializableGameState): GameEngine {
  const board = new Board()
  board.restoreState(state.board)
  return new GameEngine(board)
}

/**
 * Reconstruct a HumanPlayer with their hand from serialized state.
 */
function buildPlayer(
  playerData: SerializableGameState['players'][number]
): HumanPlayer {
  const player = new HumanPlayer(playerData.id, playerData.name, playerData.seatPosition)
  const cards = playerData.hand.map((c) => new Card(c.suit as Suit, c.rank as Rank))
  player.setHand(cards)
  player.finishPosition = playerData.finishPosition
  return player
}

/**
 * Rebuild a full Game instance from serialized state — used for executing
 * mutations (playCard, handleCannotPlay, executeCardTransfer) so that
 * all internal bookkeeping (turn order, rankings, etc.) stays consistent.
 */
function rebuildGame(state: SerializableGameState): Game {
  const game = new Game()

  // Initialize with player configs
  const playerConfigs = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    type: PlayerType.HUMAN as PlayerType,
  }))

  game.initializeGame(playerConfigs, state.gameMode as GameMode)
  game.dealCards() // creates random hands — we'll overwrite them

  // Restore the authoritative state from DB
  game.restoreState(state)

  // Overwrite hands with what the DB says
  const gameState = game.getState()
  gameState.players.forEach((player, index) => {
    const saved = state.players[index]
    if (saved?.hand) {
      const cards = saved.hand.map((c) => new Card(c.suit as Suit, c.rank as Rank))
      player.setHand(cards)
    }
  })

  return game
}

/**
 * Serialize a Game's current state back to the DB format.
 */
function serializeGame(game: Game): SerializableGameState {
  const s = game.getState()
  return {
    players: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      seatPosition: p.seatPosition,
      handSize: p.getHandSize(),
      hand: Array.from(p.getHand()).map((c) => ({ suit: c.suit, rank: c.rank } as ICard)),
      finishPosition: p.finishPosition,
    })),
    board: s.board,
    currentPlayerIndex: s.currentPlayerIndex,
    turnOrder: Array.from(s.turnOrder),
    gamePhase: s.gamePhase,
    gameMode: s.gameMode,
    rankings: Array.from(s.rankings),
    pendingCardTransfer: s.pendingCardTransfer,
  }
}

// ─── Initialize Game State ───────────────────────────────────────────────────

export async function initializeGameState(
  gameId: string,
  playerId: string,
  gameMode: GameMode
): Promise<ActionResult> {
  try {
    // Verify the player is the host
    const { data: player } = await (supabaseServer
      .from('game_players') as any)
      .select('is_host')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .single()

    if (!(player as any)?.is_host) {
      return { success: false, error: 'Only the host can initialize the game' }
    }

    // Fetch all players
    const { data: players } = await (supabaseServer
      .from('game_players') as any)
      .select('*')
      .eq('game_id', gameId)
      .order('seat_position')

    if (!players || players.length < 2) {
      return { success: false, error: 'Not enough players' }
    }

    // Build the game server-side
    const game = new Game()
    const playerConfigs = players.map((p: any) => ({
      id: p.player_id,
      name: p.player_name,
      type: PlayerType.HUMAN,
    }))

    game.initializeGame(playerConfigs, gameMode)
    game.dealCards()

    // Serialize and save
    const serialized = serializeGame(game)
    const saved = await saveState(gameId, serialized)

    if (!saved) {
      return { success: false, error: 'Failed to save initial game state' }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to initialize game' }
  }
}

// ─── Load Game State ─────────────────────────────────────────────────────────

export async function loadGameState(
  gameId: string
): Promise<ActionResult<SerializableGameState>> {
  try {
    const state = await loadState(gameId)
    if (!state) {
      return { success: false, error: 'Game state not found' }
    }
    return { success: true, data: state }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to load game state' }
  }
}

// ─── Play Card ───────────────────────────────────────────────────────────────

export async function playCard(
  gameId: string,
  playerId: string,
  cardSuit: Suit,
  cardRank: Rank
): Promise<ActionResult> {
  try {
    // Load current state
    const state = await loadState(gameId)
    if (!state) {
      return { success: false, error: 'Game state not found' }
    }

    // Verify it's this player's turn
    const currentPlayer = state.players[state.currentPlayerIndex]
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' }
    }

    // Verify game is in playing phase
    if (state.gamePhase !== GamePhase.PLAYING) {
      return { success: false, error: 'Game is not in playing phase' }
    }

    // Verify no pending card transfer
    if (state.pendingCardTransfer) {
      return { success: false, error: 'A card transfer is pending' }
    }

    // Server-side validation using GameEngine
    const engine = buildEngine(state)
    const player = buildPlayer(currentPlayer)
    const card = new Card(cardSuit, cardRank)
    const validation = engine.canPlayCard(card, player)

    if (!validation.isValid) {
      return { success: false, error: validation.reason || 'Invalid move' }
    }

    // Validation passed — execute the move via the full Game instance
    const game = rebuildGame(state)
    game.playCard(card)

    // Serialize and save
    const newState = serializeGame(game)
    const saved = await saveState(gameId, newState)

    if (!saved) {
      return { success: false, error: 'Failed to save game state' }
    }

    // Record the move
    await recordMove(gameId, playerId, 'play_card', {
      card: { suit: cardSuit, rank: cardRank },
    })

    // If game is finished, update the games table
    if (newState.gamePhase === GamePhase.FINISHED) {
      await (supabaseServer.from('games') as any)
        .update({
          status: 'finished',
          finished_at: new Date().toISOString(),
        })
        .eq('id', gameId)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to play card' }
  }
}

// ─── Cannot Play ─────────────────────────────────────────────────────────────

export async function handleCannotPlay(
  gameId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    const state = await loadState(gameId)
    if (!state) {
      return { success: false, error: 'Game state not found' }
    }

    // Verify it's this player's turn
    const currentPlayer = state.players[state.currentPlayerIndex]
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' }
    }

    if (state.gamePhase !== GamePhase.PLAYING) {
      return { success: false, error: 'Game is not in playing phase' }
    }

    // In easy mode, verify the player truly has no valid moves
    if (state.gameMode === GameMode.EASY) {
      const engine = buildEngine(state)
      const player = buildPlayer(currentPlayer)
      if (engine.hasValidMove(player)) {
        return { success: false, error: 'You have valid moves available (Easy mode enforces mandatory play)' }
      }
    }

    // Execute via the full Game instance
    const game = rebuildGame(state)
    game.handleCannotPlay()

    const newState = serializeGame(game)
    const saved = await saveState(gameId, newState)

    if (!saved) {
      return { success: false, error: 'Failed to save game state' }
    }

    await recordMove(gameId, playerId, 'cannot_play', {})

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to handle cannot play' }
  }
}

// ─── Execute Card Transfer ───────────────────────────────────────────────────

export async function executeCardTransfer(
  gameId: string,
  playerId: string,
  cardSuit: Suit,
  cardRank: Rank
): Promise<ActionResult> {
  try {
    const state = await loadState(gameId)
    if (!state) {
      return { success: false, error: 'Game state not found' }
    }

    if (!state.pendingCardTransfer) {
      return { success: false, error: 'No pending card transfer' }
    }

    // Verify this player is the one giving the card
    if (state.pendingCardTransfer.from !== playerId) {
      return { success: false, error: 'You are not the player giving the card' }
    }

    // Verify the giving player actually has this card
    const givingPlayer = state.players.find((p) => p.id === playerId)
    if (!givingPlayer) {
      return { success: false, error: 'Player not found' }
    }

    const hasCard = givingPlayer.hand.some(
      (c) => c.suit === cardSuit && c.rank === cardRank
    )
    if (!hasCard) {
      return { success: false, error: 'You do not have this card' }
    }

    // Execute via full Game instance
    const game = rebuildGame(state)
    const card = new Card(cardSuit, cardRank)
    game.executeCardTransfer(card)

    const newState = serializeGame(game)
    const saved = await saveState(gameId, newState)

    if (!saved) {
      return { success: false, error: 'Failed to save game state' }
    }

    await recordMove(gameId, playerId, 'transfer_card', {
      card: { suit: cardSuit, rank: cardRank },
      to: state.pendingCardTransfer.to,
    })

    // Check if game finished after transfer
    if (newState.gamePhase === GamePhase.FINISHED) {
      await (supabaseServer.from('games') as any)
        .update({
          status: 'finished',
          finished_at: new Date().toISOString(),
        })
        .eq('id', gameId)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to execute card transfer' }
  }
}
