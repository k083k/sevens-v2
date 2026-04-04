/**
 * Board class managing the 4-row card layout
 */

import { BoardState, ICard, Rank, Suit, SuitSequence } from '../types/types';

export class Board {
  private state: BoardState;

  constructor() {
    this.state = {
      [Suit.SPADES]: { low: null, high: null },
      [Suit.HEARTS]: { low: null, high: null },
      [Suit.DIAMONDS]: { low: null, high: null },
      [Suit.CLUBS]: { low: null, high: null },
    };
  }

  /**
   * Get a readonly copy of the board state
   */
  public getState(): BoardState {
    return {
      [Suit.SPADES]: { ...this.state[Suit.SPADES] },
      [Suit.HEARTS]: { ...this.state[Suit.HEARTS] },
      [Suit.DIAMONDS]: { ...this.state[Suit.DIAMONDS] },
      [Suit.CLUBS]: { ...this.state[Suit.CLUBS] },
    };
  }

  /**
   * Get the sequence state for a specific suit
   */
  public getSuitSequence(suit: Suit): SuitSequence {
    return { ...this.state[suit] };
  }

  /**
   * Check if a suit's row is open (7 has been played)
   */
  public isSuitOpen(suit: Suit): boolean {
    return this.state[suit].low !== null || this.state[suit].high !== null;
  }

  /**
   * Check if a specific rank exists on the spades row
   * This is used for the Spades Lock rule
   */
  public isRankOnSpades(rank: Rank): boolean {
    const spadesSeq = this.state[Suit.SPADES];

    // If spades not open yet, only rank 7 exists
    if (!this.isSuitOpen(Suit.SPADES)) {
      return rank === 7;
    }

    // Check if rank is within the spades sequence range
    return rank >= spadesSeq.low! && rank <= spadesSeq.high!;
  }

  /**
   * Play a card on the board
   * @throws Error if the play is invalid
   */
  public playCard(card: ICard): void {
    const suit = card.suit;
    const rank = card.rank;
    const sequence = this.state[suit];

    // If this is a 7, it opens the suit
    if (rank === 7) {
      if (this.isSuitOpen(suit)) {
        throw new Error(`Suit ${suit} is already open`);
      }
      this.state[suit] = { low: 7, high: 7 };
      return;
    }

    // Suit must be open
    if (!this.isSuitOpen(suit)) {
      throw new Error(`Cannot play ${card.toString()}: suit ${suit} is not open`);
    }

    // Card must be adjacent to current sequence
    if (rank === sequence.low! - 1) {
      // Extending downward
      this.state[suit] = { ...sequence, low: rank };
    } else if (rank === sequence.high! + 1) {
      // Extending upward
      this.state[suit] = { ...sequence, high: rank };
    } else {
      throw new Error(
        `Cannot play ${card.toString()}: must be adjacent to current sequence (${sequence.low}-${sequence.high})`
      );
    }
  }

  /**
   * Check if a card can be placed on the board based on sequence rules only
   * (Does NOT check spades lock - that's GameEngine's responsibility)
   */
  public canPlaceCard(card: ICard): boolean {
    const suit = card.suit;
    const rank = card.rank;
    const sequence = this.state[suit];

    // If this is a 7, check if suit is not already open
    if (rank === 7) {
      return !this.isSuitOpen(suit);
    }

    // Suit must be open
    if (!this.isSuitOpen(suit)) {
      return false;
    }

    // Card must be adjacent to current sequence
    return rank === sequence.low! - 1 || rank === sequence.high! + 1;
  }

  /**
   * Restore board state from serialized data (for multiplayer sync)
   */
  public restoreState(boardState: BoardState): void {
    this.state = {
      [Suit.SPADES]: { ...boardState[Suit.SPADES] },
      [Suit.HEARTS]: { ...boardState[Suit.HEARTS] },
      [Suit.DIAMONDS]: { ...boardState[Suit.DIAMONDS] },
      [Suit.CLUBS]: { ...boardState[Suit.CLUBS] },
    };
  }

  /**
   * Reset the board to initial state
   */
  public reset(): void {
    this.state = {
      [Suit.SPADES]: { low: null, high: null },
      [Suit.HEARTS]: { low: null, high: null },
      [Suit.DIAMONDS]: { low: null, high: null },
      [Suit.CLUBS]: { low: null, high: null },
    };
  }

  /**
   * Get all ranks currently on the board for a specific suit
   */
  public getRanksInSuit(suit: Suit): Rank[] {
    const sequence = this.state[suit];
    if (!this.isSuitOpen(suit)) {
      return [];
    }

    const ranks: Rank[] = [];
    for (let rank = sequence.low!; rank <= sequence.high!; rank++) {
      ranks.push(rank as Rank);
    }
    return ranks;
  }

  /**
   * Check if the board is complete (all 52 cards played)
   */
  public isComplete(): boolean {
    return (
      this.state[Suit.SPADES].low === 1 &&
      this.state[Suit.SPADES].high === 13 &&
      this.state[Suit.HEARTS].low === 1 &&
      this.state[Suit.HEARTS].high === 13 &&
      this.state[Suit.DIAMONDS].low === 1 &&
      this.state[Suit.DIAMONDS].high === 13 &&
      this.state[Suit.CLUBS].low === 1 &&
      this.state[Suit.CLUBS].high === 13
    );
  }
}
