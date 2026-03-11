/**
 * Immutable Card class representing a single playing card
 */

import { ICard, Rank, Suit } from '../types/types';

export class Card implements ICard {
  public readonly suit: Suit;
  public readonly rank: Rank;

  constructor(suit: Suit, rank: Rank) {
    this.suit = suit;
    this.rank = rank;
  }

  /**
   * Check if this card equals another card
   */
  public equals(other: ICard): boolean {
    return this.suit === other.suit && this.rank === other.rank;
  }

  /**
   * Get string representation of the card
   * @returns String like "7♠" or "K♥"
   */
  public toString(): string {
    const rankStr = this.getRankString();
    const suitStr = this.getSuitSymbol();
    return `${rankStr}${suitStr}`;
  }

  /**
   * Get the rank as a display string
   */
  private getRankString(): string {
    switch (this.rank) {
      case 1:
        return 'A';
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      default:
        return this.rank.toString();
    }
  }

  /**
   * Get the suit symbol
   */
  private getSuitSymbol(): string {
    switch (this.suit) {
      case Suit.SPADES:
        return '♠';
      case Suit.HEARTS:
        return '♥';
      case Suit.DIAMONDS:
        return '♦';
      case Suit.CLUBS:
        return '♣';
    }
  }

  /**
   * Helper method to check if this is a seven
   */
  public isSeven(): boolean {
    return this.rank === 7;
  }

  /**
   * Helper method to check if this is the 7 of spades
   */
  public isSevenOfSpades(): boolean {
    return this.suit === Suit.SPADES && this.rank === 7;
  }
}
