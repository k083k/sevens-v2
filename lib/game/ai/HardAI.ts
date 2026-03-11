/**
 * HardAI - Strategic play implementation
 *
 * Strategy priorities:
 * 1. Advance spades to unlock more cards
 * 2. Avoid opening suits that benefit opponents
 * 3. Hold 7s strategically when better plays exist
 * 4. When giving cards, give the most disruptive/unplayable card
 */

import { BoardState, IAIStrategy, ICard, IPlayer, Suit } from '../types/types';

export class HardAI implements IAIStrategy {
  /**
   * Select the best strategic card to play
   */
  public selectCardToPlay(
    hand: ReadonlyArray<ICard>,
    validCards: ReadonlyArray<ICard>,
    boardState: BoardState
  ): ICard {
    if (validCards.length === 0) {
      throw new Error('No valid cards to play');
    }

    // Priority 1: Play spades cards to unlock more ranks
    const spadesCards = validCards.filter((card) => card.suit === Suit.SPADES);
    if (spadesCards.length > 0) {
      // Prefer extending toward extremes (Ace or King) to unlock more cards
      const sortedSpades = this.sortByDistanceFromSeven(spadesCards);
      return sortedSpades[0];
    }

    // Priority 2: Play non-7 cards before opening new suits
    const nonSevenCards = validCards.filter((card) => card.rank !== 7);
    if (nonSevenCards.length > 0) {
      // Prefer cards that are further from 7 (harder to play later)
      const sorted = this.sortByDistanceFromSeven(nonSevenCards);
      return sorted[0];
    }

    // Priority 3: If only 7s remain, play one (strategic hold didn't work out)
    return validCards[0];
  }

  /**
   * Select the most disruptive card to give to an opponent
   */
  public selectCardToGive(
    hand: ReadonlyArray<ICard>,
    recipient: IPlayer,
    boardState: BoardState
  ): ICard {
    if (hand.length === 0) {
      throw new Error('No cards in hand to give');
    }

    // Strategy: Give cards that are hardest to play

    // Priority 1: Give cards in suits not yet opened (locked behind 7s)
    const cardsInClosedSuits = hand.filter((card) => {
      const suitState = boardState[card.suit];
      return suitState.low === null && suitState.high === null;
    });

    if (cardsInClosedSuits.length > 0) {
      // Among closed suits, give cards furthest from 7 (most delayed)
      return this.sortByDistanceFromSeven(cardsInClosedSuits)[0];
    }

    // Priority 2: Give cards that are locked by spades
    const lockedCards = hand.filter((card) => {
      if (card.suit === Suit.SPADES) return false;

      const spadesState = boardState[Suit.SPADES];
      if (!spadesState.low || !spadesState.high) return true;

      // Check if rank is outside spades range
      return card.rank < spadesState.low || card.rank > spadesState.high;
    });

    if (lockedCards.length > 0) {
      return this.sortByDistanceFromSeven(lockedCards)[0];
    }

    // Priority 3: Give cards at sequence extremes (least immediately playable)
    const cardsAtExtremes = hand.filter((card) => {
      const suitState = boardState[card.suit];
      if (!suitState.low || !suitState.high) return false;

      // Check if card is NOT adjacent to current sequence
      return card.rank !== suitState.low - 1 && card.rank !== suitState.high + 1;
    });

    if (cardsAtExtremes.length > 0) {
      return this.sortByDistanceFromSeven(cardsAtExtremes)[0];
    }

    // Fallback: Give card furthest from 7
    return this.sortByDistanceFromSeven(hand)[0];
  }

  /**
   * Sort cards by their distance from 7 (furthest first)
   * Cards further from 7 are harder to play and more strategic to hold/give
   */
  private sortByDistanceFromSeven(cards: ReadonlyArray<ICard>): ICard[] {
    return [...cards].sort((a, b) => {
      const distA = Math.abs(a.rank - 7);
      const distB = Math.abs(b.rank - 7);
      return distB - distA; // Descending order (furthest first)
    });
  }
}
