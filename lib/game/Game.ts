/**
 * Game - Main orchestrator for the Sevens card game
 *
 * Coordinates all game components and manages game flow
 */

import { Deck } from './models/Deck';
import { Board } from './models/Board';
import { GameEngine } from './engine/GameEngine';
import { HumanPlayer } from './models/Player';
import { EasyAIPlayer, HardAIPlayer } from './models/AIPlayers';
import {
  IPlayer,
  GamePhase,
  PlayerType,
  ICard,
  GameState,
  PendingCardTransfer,
  BoardState,
  GameMode,
} from './types/types';
import { AIPlayer } from './models/Player';

export class Game {
  private deck: Deck;
  private board: Board;
  private engine: GameEngine;
  private players: IPlayer[];
  private currentPlayerIndex: number;
  private turnOrder: string[];
  private gamePhase: GamePhase;
  private gameMode: GameMode;
  private rankings: string[];
  private pendingCardTransfer: PendingCardTransfer | null;

  constructor() {
    this.deck = new Deck();
    this.board = new Board();
    this.engine = new GameEngine(this.board);
    this.players = [];
    this.currentPlayerIndex = 0;
    this.turnOrder = [];
    this.gamePhase = GamePhase.NOT_STARTED;
    this.gameMode = GameMode.EASY; // Default to Easy mode
    this.rankings = [];
    this.pendingCardTransfer = null;
  }

  /**
   * Initialize a new game with players
   */
  public initializeGame(
    playerConfigs: Array<{ name: string; type: PlayerType }>,
    gameMode: GameMode = GameMode.EASY
  ): void {
    if (playerConfigs.length < 2 || playerConfigs.length > 4) {
      throw new Error('Game requires 2-4 players');
    }

    // Reset game state
    this.reset();

    // Set game mode
    this.gameMode = gameMode;

    // Create players with randomized seating positions
    const seatPositions = this.shuffleArray([0, 1, 2, 3].slice(0, playerConfigs.length));

    this.players = playerConfigs.map((config, index) => {
      const playerId = `player-${index}`;
      const seatPosition = seatPositions[index];

      switch (config.type) {
        case PlayerType.HUMAN:
          return new HumanPlayer(playerId, config.name, seatPosition);
        case PlayerType.AI_EASY:
          return new EasyAIPlayer(playerId, config.name, seatPosition);
        case PlayerType.AI_HARD:
          return new HardAIPlayer(playerId, config.name, seatPosition);
        default:
          throw new Error(`Unknown player type: ${config.type}`);
      }
    });

    this.gamePhase = GamePhase.DEALING;
  }

  /**
   * Deal cards to all players
   */
  public dealCards(): void {
    if (this.gamePhase !== GamePhase.DEALING) {
      throw new Error('Cannot deal cards in current game phase');
    }

    const hands = this.deck.deal(this.players.length);

    // Assign hands to players
    this.players.forEach((player, index) => {
      player.setHand(hands[index]);
    });

    // Determine turn order (starting with player who has 7♠)
    this.turnOrder = this.engine.determineTurnOrder(this.players);

    // Set current player to the one with 7♠
    const firstPlayerId = this.turnOrder[0];
    this.currentPlayerIndex = this.players.findIndex((p) => p.id === firstPlayerId);

    this.gamePhase = GamePhase.PLAYING;
  }

  /**
   * Play a card for the current player
   */
  public playCard(card: ICard): void {
    if (this.gamePhase !== GamePhase.PLAYING) {
      throw new Error('Cannot play card: game is not in playing phase');
    }

    if (this.pendingCardTransfer !== null) {
      throw new Error('Cannot play card: card transfer is pending');
    }

    const currentPlayer = this.getCurrentPlayer();

    // Validate and play the card
    this.engine.playCard(card, currentPlayer);

    // Check if player won
    if (this.engine.hasPlayerWon(currentPlayer)) {
      this.handlePlayerWin(currentPlayer);
    }

    // Move to next player
    this.advanceTurn();
  }

  /**
   * Handle when current player cannot play (must take card from previous player)
   */
  public handleCannotPlay(): void {
    if (this.gamePhase !== GamePhase.PLAYING) {
      throw new Error('Cannot handle cannot-play: game is not in playing phase');
    }

    const currentPlayer = this.getCurrentPlayer();

    // In Easy mode, verify player truly has no valid moves
    // In Hard mode, allow strategic passing even with valid cards
    if (this.gameMode === GameMode.EASY && this.engine.hasValidMove(currentPlayer)) {
      throw new Error('Player has valid moves available (Easy mode enforces mandatory play)');
    }

    // Find previous player in turn order
    const previousPlayer = this.getPreviousPlayer();

    // Set pending card transfer
    this.pendingCardTransfer = {
      from: previousPlayer.id,
      to: currentPlayer.id,
    };
  }

  /**
   * Execute the pending card transfer
   * The giving player chooses which card to give
   */
  public executeCardTransfer(card: ICard): void {
    if (this.pendingCardTransfer === null) {
      throw new Error('No pending card transfer');
    }

    const fromPlayer = this.getPlayerById(this.pendingCardTransfer.from);
    const toPlayer = this.getPlayerById(this.pendingCardTransfer.to);

    if (!fromPlayer || !toPlayer) {
      throw new Error('Invalid player IDs in card transfer');
    }

    // Verify the giving player has the card
    if (!fromPlayer.hasCard(card)) {
      throw new Error('Player does not have this card');
    }

    // Transfer the card
    fromPlayer.removeCard(card);
    toPlayer.addCard(card);

    // Check if giving player won by emptying their hand
    if (this.engine.hasPlayerWon(fromPlayer)) {
      this.handlePlayerWin(fromPlayer);
    }

    // Clear pending transfer
    this.pendingCardTransfer = null;

    // Advance turn
    this.advanceTurn();
  }

  /**
   * Get valid cards for current player
   */
  public getValidCardsForCurrentPlayer(): ICard[] {
    return this.engine.getValidCards(this.getCurrentPlayer());
  }

  /**
   * Check if current player has valid moves
   */
  public currentPlayerHasValidMoves(): boolean {
    return this.engine.hasValidMove(this.getCurrentPlayer());
  }

  /**
   * Get current player
   */
  public getCurrentPlayer(): IPlayer {
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get previous player in turn order
   */
  private getPreviousPlayer(): IPlayer {
    const currentTurnIndex = this.turnOrder.indexOf(this.getCurrentPlayer().id);
    const previousTurnIndex = (currentTurnIndex - 1 + this.turnOrder.length) % this.turnOrder.length;
    const previousPlayerId = this.turnOrder[previousTurnIndex];
    return this.getPlayerById(previousPlayerId)!;
  }

  /**
   * Get player by ID
   */
  private getPlayerById(id: string): IPlayer | undefined {
    return this.players.find((p) => p.id === id);
  }

  /**
   * Handle a player winning
   */
  private handlePlayerWin(player: IPlayer): void {
    const finishPosition = this.rankings.length + 1;
    player.finishPosition = finishPosition;
    this.rankings.push(player.id);

    // Remove player from turn order
    this.turnOrder = this.turnOrder.filter((id) => id !== player.id);

    // Check if game is over (only one player remains)
    if (this.turnOrder.length === 1) {
      // Last remaining player gets last place
      const lastPlayer = this.getPlayerById(this.turnOrder[0]);
      if (lastPlayer) {
        lastPlayer.finishPosition = this.rankings.length + 1;
        this.rankings.push(lastPlayer.id);
      }
      this.gamePhase = GamePhase.FINISHED;
    }
  }

  /**
   * Advance to next player's turn
   */
  private advanceTurn(): void {
    if (this.turnOrder.length === 0) {
      this.gamePhase = GamePhase.FINISHED;
      return;
    }

    // Find next player in turn order
    let nextPlayerId: string;
    let attempts = 0;

    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      const player = this.players[this.currentPlayerIndex];
      nextPlayerId = player.id;
      attempts++;

      if (attempts > this.players.length * 2) {
        throw new Error('Could not find next player in turn order');
      }
    } while (!this.turnOrder.includes(nextPlayerId));
  }

  /**
   * Get current game state (readonly)
   */
  public getState(): GameState {
    // Include valid cards in Easy mode for the current player
    const validCards = (this.gameMode === GameMode.EASY && this.gamePhase === GamePhase.PLAYING)
      ? this.getValidCardsForCurrentPlayer()
      : undefined;

    return {
      players: [...this.players],
      board: this.board.getState(),
      currentPlayerIndex: this.currentPlayerIndex,
      turnOrder: [...this.turnOrder],
      gamePhase: this.gamePhase,
      gameMode: this.gameMode,
      rankings: [...this.rankings],
      pendingCardTransfer: this.pendingCardTransfer,
      validCards,
    };
  }

  /**
   * Get board state
   */
  public getBoardState(): BoardState {
    return this.board.getState();
  }

  /**
   * Reset the game
   */
  private reset(): void {
    this.board.reset();
    this.engine.reset();
    this.players = [];
    this.currentPlayerIndex = 0;
    this.turnOrder = [];
    this.gamePhase = GamePhase.NOT_STARTED;
    this.gameMode = GameMode.EASY; // Reset to default
    this.rankings = [];
    this.pendingCardTransfer = null;
  }

  /**
   * Fisher-Yates shuffle
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get AI decision for current player (if AI)
   */
  public getAIDecision(): { type: 'play'; card: ICard } | { type: 'cannot-play' } | null {
    const currentPlayer = this.getCurrentPlayer();

    if (!(currentPlayer instanceof AIPlayer)) {
      return null; // Not an AI player
    }

    const validCards = this.getValidCardsForCurrentPlayer();

    if (validCards.length === 0) {
      return { type: 'cannot-play' };
    }

    const card = (currentPlayer as any).selectCardToPlay(validCards, this.getBoardState());
    return { type: 'play', card };
  }

  /**
   * Get AI card selection for giving (when handling cannot-play)
   */
  public getAICardToGive(givingPlayerId: string, recipientPlayerId: string): ICard {
    const givingPlayer = this.getPlayerById(givingPlayerId);
    const recipient = this.getPlayerById(recipientPlayerId);

    if (!givingPlayer || !recipient) {
      throw new Error('Invalid player IDs');
    }

    if (!(givingPlayer instanceof AIPlayer)) {
      throw new Error('Giving player is not an AI');
    }

    return (givingPlayer as any).selectCardToGive(recipient, this.getBoardState());
  }
}
