/**
 * Zustand Game Store
 * Thin state management layer over the Game class
 */

import { create } from 'zustand';
import { Game } from '../game/Game';
import { GameState, PlayerType, ICard, GameMode } from '../game/types/types';

interface GameStoreState {
  game: Game | null;
  gameState: GameState | null;

  // Actions
  initializeGame: (
    playerConfigs: Array<{ name: string; type: PlayerType }>,
    gameMode?: GameMode
  ) => void;
  dealCards: () => void;
  playCard: (card: ICard) => void;
  handleCannotPlay: () => void;
  executeCardTransfer: (card: ICard) => void;
  processAITurn: () => void;
  processAICardGiving: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: null,
  gameState: null,

  /**
   * Initialize a new game
   */
  initializeGame: (playerConfigs, gameMode = GameMode.EASY) => {
    const game = new Game();
    game.initializeGame(playerConfigs, gameMode);
    set({ game, gameState: game.getState() });
  },

  /**
   * Deal cards to start the game
   */
  dealCards: () => {
    const { game } = get();
    if (!game) {
      throw new Error('Game not initialized');
    }

    game.dealCards();
    set({ gameState: game.getState() });
  },

  /**
   * Play a card for the current player
   */
  playCard: (card) => {
    const { game } = get();
    if (!game) {
      throw new Error('Game not initialized');
    }

    game.playCard(card);
    set({ gameState: game.getState() });
  },

  /**
   * Handle when current player cannot play
   */
  handleCannotPlay: () => {
    const { game } = get();
    if (!game) {
      throw new Error('Game not initialized');
    }

    game.handleCannotPlay();
    set({ gameState: game.getState() });
  },

  /**
   * Execute a card transfer (when player cannot play)
   */
  executeCardTransfer: (card) => {
    const { game } = get();
    if (!game) {
      throw new Error('Game not initialized');
    }

    // Ensure card has proper structure (may have lost prototype chain through React state)
    const cardToTransfer = {
      suit: card.suit,
      rank: card.rank,
      equals: (other: ICard) => card.suit === other.suit && card.rank === other.rank,
      toString: () => `${card.rank}${card.suit}`,
      isSeven: () => card.rank === 7,
      isSevenOfSpades: () => card.suit === 'spades' && card.rank === 7
    } as ICard;

    game.executeCardTransfer(cardToTransfer);
    set({ gameState: game.getState() });
  },

  /**
   * Process AI turn automatically
   */
  processAITurn: () => {
    const { game } = get();
    if (!game) {
      throw new Error('Game not initialized');
    }

    const currentPlayer = game.getCurrentPlayer();
    const aiDecision = game.getAIDecision();

    if (!aiDecision) {
      // Not an AI player, do nothing
      return;
    }

    if (aiDecision.type === 'play') {
      // AI plays a card
      game.playCard(aiDecision.card);
      set({ gameState: game.getState() });
    } else if (aiDecision.type === 'cannot-play') {
      // AI cannot play, must take card from previous player
      game.handleCannotPlay();
      const updatedState = game.getState();
      set({ gameState: updatedState });

      // Now the previous player (possibly AI) must choose a card to give
      if (updatedState.pendingCardTransfer) {
        const givingPlayer = game.getState().players.find(
          (p) => p.id === updatedState.pendingCardTransfer!.from
        );

        // If giving player is also AI, auto-select card
        if (givingPlayer && givingPlayer.type !== PlayerType.HUMAN) {
          const cardToGive = game.getAICardToGive(
            updatedState.pendingCardTransfer.from,
            updatedState.pendingCardTransfer.to
          );
          game.executeCardTransfer(cardToGive);
          set({ gameState: game.getState() });
        }
      }
    }
  },

  /**
   * Process AI giving a card when there's a pending card transfer
   */
  processAICardGiving: () => {
    const { game } = get();
    if (!game) {
      throw new Error('Game not initialized');
    }

    const state = game.getState();
    if (!state.pendingCardTransfer) {
      return; // No pending transfer
    }

    const givingPlayer = state.players.find(
      (p) => p.id === state.pendingCardTransfer!.from
    );

    // If giving player is AI, auto-select and give card
    if (givingPlayer && givingPlayer.type !== PlayerType.HUMAN) {
      const cardToGive = game.getAICardToGive(
        state.pendingCardTransfer.from,
        state.pendingCardTransfer.to
      );

      // Ensure card has proper structure
      const cardToTransfer = {
        suit: cardToGive.suit,
        rank: cardToGive.rank,
        equals: (other: ICard) => cardToGive.suit === other.suit && cardToGive.rank === other.rank,
        toString: () => `${cardToGive.rank}${cardToGive.suit}`,
        isSeven: () => cardToGive.rank === 7,
        isSevenOfSpades: () => cardToGive.suit === 'spades' && cardToGive.rank === 7
      } as ICard;

      game.executeCardTransfer(cardToTransfer);
      set({ gameState: game.getState() });
    }
  },

  /**
   * Reset the game
   */
  resetGame: () => {
    set({ game: null, gameState: null });
  },
}));
