/**
 * Multiplayer Game Store
 *
 * Manages multiplayer game state with real-time synchronization.
 * All mutations go through server actions — the client never writes to DB directly.
 * The client only subscribes to realtime updates (read-only).
 */

import { create } from 'zustand'
import { Game } from '../game/Game'
import { GameState, PlayerType, ICard, GameMode, IPlayer, Suit, Rank } from '../game/types/types'
import { Card } from '../game/models/Card'
import {
  subscribeToGameState,
  unsubscribeFromGameState,
  reconstructHand,
  SerializableGameState,
} from '../multiplayer/sync'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Server actions
import {
  initializeGameState as serverInitializeGame,
  loadGameState as serverLoadGameState,
  playCard as serverPlayCard,
  handleCannotPlay as serverHandleCannotPlay,
  executeCardTransfer as serverExecuteCardTransfer,
} from '../actions/game-actions'
import { getGamePlayers } from '../actions/lobby-actions'

interface MultiplayerStoreState {
  game: Game | null
  gameState: GameState | null
  gameId: string | null
  playerId: string | null
  isMyTurn: boolean
  channel: RealtimeChannel | null

  // Actions
  initializeMultiplayerGame: (
    gameId: string,
    playerId: string,
    gameMode: GameMode
  ) => Promise<void>
  playCard: (card: ICard) => Promise<void>
  handleCannotPlay: () => Promise<void>
  executeCardTransfer: (card: ICard) => Promise<void>
  cleanup: () => void
}

/**
 * Rebuild a local Game instance from serialized state (for rendering only).
 * The authoritative state lives in the database — this is just so the
 * UI has a Game object to read from.
 */
function rebuildLocalGame(state: SerializableGameState): Game {
  const game = new Game()
  const playerConfigs = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    type: PlayerType.HUMAN as PlayerType,
  }))

  game.initializeGame(playerConfigs, state.gameMode as GameMode)
  game.dealCards()
  game.restoreState(state)

  // Overwrite hands with DB data
  const gameState = game.getState()
  gameState.players.forEach((player: IPlayer, index: number) => {
    const saved = state.players[index]
    if (saved?.hand) {
      const reconstructedHand = reconstructHand(saved.hand)
      player.setHand(reconstructedHand)
    }
  })

  return game
}

export const useMultiplayerStore = create<MultiplayerStoreState>((set, get) => ({
  game: null,
  gameState: null,
  gameId: null,
  playerId: null,
  isMyTurn: false,
  channel: null,

  /**
   * Initialize multiplayer game.
   * Host: tells the server to deal and save state.
   * Non-host: loads state from server.
   */
  initializeMultiplayerGame: async (gameId: string, playerId: string, gameMode: GameMode) => {
    try {
      const players = await getGamePlayers(gameId)

      if (!players || players.length < 2) {
        throw new Error('Not enough players to start game')
      }

      const currentPlayer = players.find((p: any) => p.player_id === playerId)

      if (currentPlayer?.is_host) {
        // Host: server initializes the game (deals cards, saves state)
        const result = await serverInitializeGame(gameId, playerId, gameMode)
        if (!result.success) {
          throw new Error('error' in result ? result.error : 'Failed to initialize game')
        }
      } else {
        // Non-host: wait briefly for host to finish initializing
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Both host and non-host: load state from server
      const loadResult = await serverLoadGameState(gameId)
      if (!loadResult.success || !('data' in loadResult)) {
        throw new Error('Failed to load game state')
      }

      const serverState = loadResult.data
      const game = rebuildLocalGame(serverState)
      const initialState = game.getState()

      // Determine if it's this player's turn
      const myPlayerIndex = serverState.players.findIndex((p) => p.id === playerId)
      const isMyTurn = serverState.currentPlayerIndex === myPlayerIndex

      set({
        game,
        gameState: initialState,
        gameId,
        playerId,
        isMyTurn,
      })

      // Subscribe to realtime updates (read-only)
      const channel = subscribeToGameState(gameId, (newState: SerializableGameState) => {
        const { playerId } = get()
        if (!playerId) return

        // Rebuild local game from the new server state
        const updatedGame = rebuildLocalGame(newState)

        const myIdx = newState.players.findIndex((p) => p.id === playerId)
        const isMyTurn = newState.currentPlayerIndex === myIdx

        set({
          game: updatedGame,
          gameState: updatedGame.getState(),
          isMyTurn,
        })
      })

      set({ channel })
    } catch (error) {
      console.error('Error initializing multiplayer game:', error)
      throw error
    }
  },

  /**
   * Play a card — sends to server action for validation, then waits for
   * the realtime update to come back with the new state.
   */
  playCard: async (card: ICard) => {
    const { gameId, playerId, isMyTurn } = get()

    if (!gameId || !playerId) throw new Error('Game not initialized')
    if (!isMyTurn) throw new Error('Not your turn!')

    const result = await serverPlayCard(
      gameId,
      playerId,
      card.suit as Suit,
      card.rank as Rank
    )

    if (!result.success) {
      throw new Error('error' in result ? result.error : 'Failed to play card')
    }

    // Optimistic: mark turn as over immediately
    // The realtime subscription will update the full state
    set({ isMyTurn: false })
  },

  /**
   * Handle cannot play — server validates and executes.
   */
  handleCannotPlay: async () => {
    const { gameId, playerId, isMyTurn } = get()

    if (!gameId || !playerId) throw new Error('Game not initialized')
    if (!isMyTurn) throw new Error('Not your turn!')

    const result = await serverHandleCannotPlay(gameId, playerId)

    if (!result.success) {
      throw new Error('error' in result ? result.error : 'Failed to handle cannot play')
    }

    set({ isMyTurn: false })
  },

  /**
   * Execute card transfer — server validates the giving player has the card.
   */
  executeCardTransfer: async (card: ICard) => {
    const { gameId, playerId } = get()

    if (!gameId || !playerId) throw new Error('Game not initialized')

    const result = await serverExecuteCardTransfer(
      gameId,
      playerId,
      card.suit as Suit,
      card.rank as Rank
    )

    if (!result.success) {
      throw new Error('error' in result ? result.error : 'Failed to transfer card')
    }
  },

  /**
   * Cleanup — unsubscribe from realtime.
   */
  cleanup: () => {
    const { channel } = get()
    if (channel) {
      unsubscribeFromGameState(channel)
    }
    set({
      game: null,
      gameState: null,
      gameId: null,
      playerId: null,
      isMyTurn: false,
      channel: null,
    })
  },
}))
