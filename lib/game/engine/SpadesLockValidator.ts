/**
 * SpadesLockValidator - Enforces the Spades Lock rule
 *
 * CRITICAL RULE: No card of any rank in Hearts, Diamonds, or Clubs can be played
 * unless that same rank is already present on the Spades row.
 *
 * This applies in BOTH directions (toward Ace and toward King).
 *
 * Spades itself plays freely (only constrained by sequence rules).
 */

import { Board } from '../models/Board';
import { ICard, Rank, Suit } from '../types/types';

export class SpadesLockValidator {
  /**
   * Check if a card satisfies the Spades Lock rule
   *
   * @param card The card to validate
   * @param board The current board state
   * @returns true if the card can be played according to spades lock, false otherwise
   */
  public static isUnlocked(card: ICard, board: Board): boolean {
    const { suit, rank } = card;

    // Spades always plays freely (no lock on itself)
    if (suit === Suit.SPADES) {
      return true;
    }

    // For all other suits, the rank must exist on the spades row
    return board.isRankOnSpades(rank);
  }

  /**
   * Get a detailed reason why a card is locked
   *
   * @param card The card to check
   * @param board The current board state
   * @returns A reason string if locked, null if unlocked
   */
  public static getLockReason(card: ICard, board: Board): string | null {
    if (this.isUnlocked(card, board)) {
      return null;
    }

    const { suit, rank } = card;
    const rankName = this.getRankName(rank);

    return `${card.toString()} is locked: ${rankName} must be played in Spades first`;
  }

  /**
   * Get all unlocked ranks for a specific suit
   *
   * @param suit The suit to check
   * @param board The current board state
   * @returns Array of unlocked ranks
   */
  public static getUnlockedRanks(suit: Suit, board: Board): Rank[] {
    // Spades is never locked
    if (suit === Suit.SPADES) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    }

    // For other suits, only return ranks that exist on spades
    const spadesSequence = board.getSuitSequence(Suit.SPADES);

    if (!board.isSuitOpen(Suit.SPADES)) {
      // Only 7 is unlocked before spades is opened
      return [7];
    }

    const unlockedRanks: Rank[] = [];
    for (let rank = spadesSequence.low!; rank <= spadesSequence.high!; rank++) {
      unlockedRanks.push(rank as Rank);
    }

    return unlockedRanks;
  }

  /**
   * Helper to get human-readable rank name
   */
  private static getRankName(rank: Rank): string {
    switch (rank) {
      case 1:
        return 'Ace';
      case 11:
        return 'Jack';
      case 12:
        return 'Queen';
      case 13:
        return 'King';
      default:
        return rank.toString();
    }
  }

  /**
   * Check if opening a specific suit (playing its 7) would be valid
   * Note: All 7s are unlocked from the start because 7♠ is always played first
   */
  public static canOpenSuit(suit: Suit, board: Board): boolean {
    // Can't open if already open
    if (board.isSuitOpen(suit)) {
      return false;
    }

    // All 7s are unlocked (7♠ is always played first, so rank 7 exists on spades)
    return this.isUnlocked({ suit, rank: 7 } as ICard, board);
  }
}
