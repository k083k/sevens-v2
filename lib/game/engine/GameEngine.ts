/**
 * GameEngine - Core rule enforcement and game logic
 */

import { Board } from '../models/Board';
import { ICard, IPlayer, ValidMoveResult, Suit } from '../types/types';
import { SpadesLockValidator } from './SpadesLockValidator';

export class GameEngine {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  /**
   * Check if a card can be played by a player
   *
   * Validates ALL rules:
   * 0. First card of the game must be 7♠
   * 1. Player has the card in their hand
   * 2. Card can be placed on the board (sequence rules)
   * 3. Spades lock is satisfied
   */
  public canPlayCard(card: ICard, player: IPlayer): ValidMoveResult {
    // Rule 0: First card must be 7♠ (if board is empty)
    const isBoardEmpty = !this.board.isSuitOpen(Suit.SPADES) &&
                         !this.board.isSuitOpen(Suit.HEARTS) &&
                         !this.board.isSuitOpen(Suit.DIAMONDS) &&
                         !this.board.isSuitOpen(Suit.CLUBS);

    if (isBoardEmpty) {
      const is7OfSpades = card.rank === 7 && card.suit === Suit.SPADES;
      if (!is7OfSpades) {
        return {
          isValid: false,
          reason: 'First card must be the 7 of spades',
        };
      }
    }

    // Rule 1: Player must have the card
    if (!player.hasCard(card)) {
      return {
        isValid: false,
        reason: 'You do not have this card in your hand',
      };
    }

    // Rule 2: Card must fit in the sequence
    if (!this.board.canPlaceCard(card)) {
      if (card.rank === 7) {
        return {
          isValid: false,
          reason: `${card.suit} is already open`,
        };
      }
      return {
        isValid: false,
        reason: 'Card must be adjacent to the current sequence',
      };
    }

    // Rule 3: Spades lock must be satisfied
    if (!SpadesLockValidator.isUnlocked(card, this.board)) {
      const reason = SpadesLockValidator.getLockReason(card, this.board);
      return {
        isValid: false,
        reason: reason || 'Card is locked by spades rule',
      };
    }

    return { isValid: true };
  }

  /**
   * Get all valid cards a player can play
   */
  public getValidCards(player: IPlayer): ICard[] {
    const hand = player.getHand();
    const validCards: ICard[] = [];

    for (const card of hand) {
      const result = this.canPlayCard(card, player);
      if (result.isValid) {
        validCards.push(card);
      }
    }

    return validCards;
  }

  /**
   * Check if a player has any valid moves
   */
  public hasValidMove(player: IPlayer): boolean {
    return this.getValidCards(player).length > 0;
  }

  /**
   * Play a card
   * @throws Error if the move is invalid
   */
  public playCard(card: ICard, player: IPlayer): void {
    const validation = this.canPlayCard(card, player);
    if (!validation.isValid) {
      throw new Error(`Invalid move: ${validation.reason}`);
    }

    // Remove card from player's hand
    if (!player.removeCard(card)) {
      throw new Error('Failed to remove card from player hand');
    }

    // Place card on board
    this.board.playCard(card);
  }

  /**
   * Find which player has the 7 of spades
   */
  public findPlayerWithSevenOfSpades(players: ReadonlyArray<IPlayer>): IPlayer | null {
    return players.find((player) => player.hasSevenOfSpades()) || null;
  }

  /**
   * Determine turn order starting from the player with 7 of spades
   */
  public determineTurnOrder(players: ReadonlyArray<IPlayer>): string[] {
    const starterIndex = players.findIndex((player) => player.hasSevenOfSpades());

    if (starterIndex === -1) {
      throw new Error('No player has the 7 of spades');
    }

    // Create turn order starting from the player with 7♠, going clockwise
    const turnOrder: string[] = [];
    for (let i = 0; i < players.length; i++) {
      const playerIndex = (starterIndex + i) % players.length;
      turnOrder.push(players[playerIndex].id);
    }

    return turnOrder;
  }

  /**
   * Check if a player has won (emptied their hand)
   */
  public hasPlayerWon(player: IPlayer): boolean {
    return player.isEmpty();
  }

  /**
   * Get the board instance
   */
  public getBoard(): Board {
    return this.board;
  }

  /**
   * Reset the game engine
   */
  public reset(): void {
    this.board.reset();
  }
}
