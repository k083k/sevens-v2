/**
 * Multiplayer Game Store
 *
 * Manages multiplayer game state with real-time synchronization
 */

import { create } from 'zustand'
import { Game } from '../game/Game'
import { GameState, PlayerType, ICard, GameMode, IPlayer } from '../game/types/types'
import {
  saveGameState,
  loadGameState,
  subscribeToGameState,
  unsubscribeFromGameState,
  recordMove,
  initializeGameState,
  finishGame,
  SerializableGameState,
  reconstructHand,
} from '../multiplayer/sync'
import { getGamePlayers } from '../multiplayer/lobby'
import type { RealtimeChannel } from '@supabase/supabase-js'

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

export const useMultiplayerStore = create<MultiplayerStoreState>((set, get) => ({
  game: null,
  gameState: null,
  gameId: null,
  playerId: null,
  isMyTurn: false,
  channel: null,

  /**
   * Initialize multiplayer game
   * Creates game state from player list and starts listening for updates
   */
  initializeMultiplayerGame: async (gameId: string, playerId: string, gameMode: GameMode) => {
    try {
      // Fetch players from database
      const players = await getGamePlayers(gameId)

      if (!players || players.length < 2) {
        throw new Error('Not enough players to start game')
      }

      const currentPlayer = players.find((p: any) => p.player_id === playerId)
      let game: Game
      let initialState: any

      if (currentPlayer?.is_host) {
        console.log('Host initializing game...')

        // Host creates the game with actual player IDs from database
        const playerConfigs = players.map((p: any) => ({
          id: p.player_id,
          name: p.player_name,
          type: PlayerType.HUMAN,
        }))

        game = new Game()
        game.initializeGame(playerConfigs, gameMode)
        game.dealCards()
        initialState = game.getState()

        // Save to database
        const initResult = await initializeGameState(gameId, initialState, playerId)
        if (!initResult.success) {
          throw new Error(`Failed to initialize: ${initResult.error}`)
        }
        console.log('Game state saved successfully')
      } else {
        console.log('Non-host loading game state...')

        // Non-host waits and loads from database
        await new Promise(resolve => setTimeout(resolve, 1500))

        const loadResult = await loadGameState(gameId)
        if (!loadResult.success || !loadResult.state) {
          throw new Error(`Failed to load game state: ${loadResult.error}`)
        }

        console.log('Loaded game state:', loadResult.state)

        // Reconstruct game from loaded state with actual player IDs
        const playerConfigs = loadResult.state.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          type: PlayerType.HUMAN,
        }))

        game = new Game()
        game.initializeGame(playerConfigs, loadResult.state.gameMode)
        game.dealCards() // This creates random hands, but we'll override them

        // Restore complete game state from database
        game.restoreState(loadResult.state)

        // Override hands with the correct hands from database
        // Reconstruct Card instances from plain objects
        const gameState = game.getState()
        gameState.players.forEach((player: IPlayer, index: number) => {
          const savedPlayer = loadResult.state!.players[index]
          if (savedPlayer && savedPlayer.hand) {
            const reconstructedHand = reconstructHand(savedPlayer.hand)
            player.setHand(reconstructedHand)
          }
        })

        initialState = gameState
      }

      // Determine if it's this player's turn
      const myPlayerIndex = players.findIndex((p: any) => p.player_id === playerId)
      const isMyTurn = initialState.currentPlayerIndex === myPlayerIndex

      set({
        game,
        gameState: initialState,
        gameId,
        playerId,
        isMyTurn,
      })

      // Subscribe to state updates
      const channel = subscribeToGameState(gameId, (newState: any) => {
        const { game, playerId } = get()
        if (!game || !playerId) return

        console.log('Received state update:', newState)

        // Restore complete game state (board, phase, turn, etc.)
        game.restoreState(newState)

        // Reconstruct game state from database
        // Reconstruct Card instances from plain objects
        const players = game.getState().players
        players.forEach((player: IPlayer, index: number) => {
          const savedPlayer = newState.players[index]
          if (savedPlayer && savedPlayer.hand) {
            const reconstructedHand = reconstructHand(savedPlayer.hand)
            player.setHand(reconstructedHand)
          }
        })

        const updatedState = game.getState()

        // Check if it's now my turn
        const myPlayerIndex = newState.players.findIndex((p: any) => p.id === playerId)
        const isMyTurn = newState.currentPlayerIndex === myPlayerIndex

        set({
          gameState: updatedState,
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
   * Play a card (multiplayer version)
   */
  playCard: async (card: ICard) => {
    const { game, gameId, playerId, isMyTurn } = get()

    if (!game || !gameId || !playerId) {
      throw new Error('Game not initialized')
    }

    if (!isMyTurn) {
      throw new Error('Not your turn!')
    }

    try {
      // Play card locally
      game.playCard(card)
      const newState = game.getState()

      // Record move
      await recordMove(gameId, playerId, 'play_card', {
        card: {
          suit: card.suit,
          rank: card.rank,
        },
      })

      // Save state to database
      await saveGameState(gameId, newState, playerId)

      // Check if game is finished
      if (newState.gamePhase === 'finished') {
        await finishGame(gameId)
      }

      // Update local state
      set({
        gameState: newState,
        isMyTurn: false, // Turn has moved to next player
      })
    } catch (error) {
      console.error('Error playing card:', error)
      throw error
    }
  },

  /**
   * Handle cannot play (multiplayer version)
   */
  handleCannotPlay: async () => {
    const { game, gameId, playerId, isMyTurn } = get()

    if (!game || !gameId || !playerId) {
      throw new Error('Game not initialized')
    }

    if (!isMyTurn) {
      throw new Error('Not your turn!')
    }

    try {
      // Handle cannot play locally
      game.handleCannotPlay()
      const newState = game.getState()

      // Record move
      await recordMove(gameId, playerId, 'cannot_play', {})

      // Save state to database
      await saveGameState(gameId, newState, playerId)

      // Update local state
      set({
        gameState: newState,
        isMyTurn: false,
      })
    } catch (error) {
      console.error('Error handling cannot play:', error)
      throw error
    }
  },

  /**
   * Execute card transfer (multiplayer version)
   */
  executeCardTransfer: async (card: ICard) => {
    const { game, gameId, playerId } = get()

    if (!game || !gameId || !playerId) {
      throw new Error('Game not initialized')
    }

    const state = game.getState()
    if (!state.pendingCardTransfer) {
      throw new Error('No pending card transfer')
    }

    // Check if this player is the one giving the card
    if (state.pendingCardTransfer.from !== playerId) {
      throw new Error('You are not the player giving the card')
    }

    try {
      // Execute transfer locally
      game.executeCardTransfer(card)
      const newState = game.getState()

      // Record move
      await recordMove(gameId, playerId, 'transfer_card', {
        card: {
          suit: card.suit,
          rank: card.rank,
        },
        to: state.pendingCardTransfer.to,
      })

      // Save state to database
      await saveGameState(gameId, newState, playerId)

      // Update local state
      set({
        gameState: newState,
      })
    } catch (error) {
      console.error('Error executing card transfer:', error)
      throw error
    }
  },

  /**
   * Cleanup (unsubscribe from realtime)
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
