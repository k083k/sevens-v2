/**
 * HardAI - Strategic play with lookahead
 *
 * Strategy priorities:
 * 1. Score each valid move by how much it improves our position
 * 2. Consider: unlocking our own cards, keeping opponents locked, holding 7s
 * 3. 1-turn lookahead: simulate each move and count how many of OUR cards become playable
 * 4. When giving cards, give the most disruptive/unplayable card
 * 5. Consider opponent hand size when giving cards
 */

import { BoardState, IAIStrategy, ICard, IPlayer, Suit, SuitSequence } from '../types/types';

export class HardAI implements IAIStrategy {
  /**
   * Select the best strategic card to play using scored evaluation
   */
  public selectCardToPlay(
    hand: ReadonlyArray<ICard>,
    validCards: ReadonlyArray<ICard>,
    boardState: BoardState
  ): ICard {
    if (validCards.length === 0) {
      throw new Error('No valid cards to play');
    }

    if (validCards.length === 1) {
      return validCards[0];
    }

    // Score each valid card
    const scored = validCards.map((card) => ({
      card,
      score: this.scoreMove(card, hand, boardState),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0].card;
  }

  /**
   * Score a potential move. Higher = better.
   */
  private scoreMove(
    card: ICard,
    hand: ReadonlyArray<ICard>,
    boardState: BoardState
  ): number {
    let score = 0;

    // Simulate playing this card
    const newBoard = this.simulatePlay(card, boardState);

    // Count how many of our remaining cards become playable after this move
    const remainingHand = hand.filter((c) => !(c.suit === card.suit && c.rank === card.rank));
    const newlyPlayable = this.countPlayableCards(remainingHand, newBoard);
    const currentlyPlayable = this.countPlayableCards(remainingHand, boardState);
    const unlocked = newlyPlayable - currentlyPlayable;

    // Big bonus for unlocking our own cards
    score += unlocked * 15;

    // Spades cards are valuable — they unlock ranks for all suits
    if (card.suit === Suit.SPADES) {
      score += 8;

      // Extra bonus for extending toward extremes (unlocks more)
      const spadesSeq = boardState[Suit.SPADES];
      if (spadesSeq.low !== null) {
        // Prefer whichever direction has more of our cards waiting
        const belowCount = remainingHand.filter(
          (c) => c.suit !== Suit.SPADES && c.rank < spadesSeq.low!
        ).length;
        const aboveCount = remainingHand.filter(
          (c) => c.suit !== Suit.SPADES && c.rank > spadesSeq.high!
        ).length;

        if (card.rank < spadesSeq.low! && belowCount > 0) score += belowCount * 3;
        if (card.rank > spadesSeq.high! && aboveCount > 0) score += aboveCount * 3;
      }
    }

    // Penalty for playing a 7 (opening a suit helps opponents too)
    if (card.rank === 7 && card.suit !== Suit.SPADES) {
      // Only penalize if we don't have many cards in that suit
      const cardsInSuit = remainingHand.filter((c) => c.suit === card.suit).length;
      if (cardsInSuit <= 2) {
        score -= 10; // We're helping opponents more than ourselves
      } else {
        score += 3; // We have cards ready to play in this suit
      }
    }

    // Bonus for cards far from 7 (harder to play later, get rid of them early)
    score += Math.abs(card.rank - 7);

    // Small bonus for playing in suits where we have adjacent cards ready
    for (const c of remainingHand) {
      if (c.suit === card.suit && Math.abs(c.rank - card.rank) === 1) {
        score += 4; // We can chain plays in this suit
      }
    }

    return score;
  }

  /**
   * Simulate playing a card and return the resulting board state
   */
  private simulatePlay(card: ICard, boardState: BoardState): BoardState {
    const newBoard: BoardState = {
      [Suit.SPADES]: { ...boardState[Suit.SPADES] },
      [Suit.HEARTS]: { ...boardState[Suit.HEARTS] },
      [Suit.DIAMONDS]: { ...boardState[Suit.DIAMONDS] },
      [Suit.CLUBS]: { ...boardState[Suit.CLUBS] },
    };

    const seq = newBoard[card.suit];

    if (card.rank === 7) {
      newBoard[card.suit] = { low: 7, high: 7 };
    } else if (seq.low !== null && card.rank === seq.low - 1) {
      newBoard[card.suit] = { ...seq, low: card.rank };
    } else if (seq.high !== null && card.rank === seq.high + 1) {
      newBoard[card.suit] = { ...seq, high: card.rank };
    }

    return newBoard;
  }

  /**
   * Count how many cards in a hand are playable on a given board state
   */
  private countPlayableCards(
    hand: ReadonlyArray<ICard>,
    boardState: BoardState
  ): number {
    let count = 0;
    for (const card of hand) {
      if (this.isPlayable(card, boardState)) count++;
    }
    return count;
  }

  /**
   * Check if a single card is playable (sequence + spades lock)
   */
  private isPlayable(card: ICard, boardState: BoardState): boolean {
    const seq = boardState[card.suit];

    // Check sequence rules
    if (card.rank === 7) {
      if (seq.low !== null) return false; // suit already open
    } else {
      if (seq.low === null) return false; // suit not open
      if (card.rank !== seq.low - 1 && card.rank !== seq.high! + 1) return false;
    }

    // Check spades lock
    if (card.suit !== Suit.SPADES) {
      const spadesSeq = boardState[Suit.SPADES];
      if (spadesSeq.low === null) {
        if (card.rank !== 7) return false;
      } else {
        if (card.rank < spadesSeq.low || card.rank > spadesSeq.high!) return false;
      }
    }

    return true;
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

    // Score each card — higher = worse for opponent (better to give away)
    const scored = hand.map((card) => ({
      card,
      score: this.scoreCardToGive(card, boardState, recipient),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0].card;
  }

  /**
   * Score how disruptive a card is to give to an opponent.
   * Higher = more disruptive (better to give).
   */
  private scoreCardToGive(
    card: ICard,
    boardState: BoardState,
    recipient: IPlayer
  ): number {
    let score = 0;

    const seq = boardState[card.suit];
    const spadesSeq = boardState[Suit.SPADES];

    // Cards in unopened suits are dead weight
    if (seq.low === null && card.rank !== 7) {
      score += 20;
    }

    // Cards locked by spades are hard to play
    if (card.suit !== Suit.SPADES && spadesSeq.low !== null) {
      if (card.rank < spadesSeq.low || card.rank > spadesSeq.high!) {
        score += 15;
        // Even worse if the needed spades rank is far away
        const distToUnlock = Math.min(
          Math.abs(card.rank - spadesSeq.low),
          Math.abs(card.rank - spadesSeq.high!)
        );
        score += distToUnlock * 2;
      }
    }

    // Cards far from current sequence are harder to play
    if (seq.low !== null && seq.high !== null) {
      const distToLow = Math.abs(card.rank - (seq.low - 1));
      const distToHigh = Math.abs(card.rank - (seq.high + 1));
      const minDist = Math.min(distToLow, distToHigh);
      score += minDist * 3;
    }

    // Distance from 7 — extreme cards are generally harder
    score += Math.abs(card.rank - 7);

    // If recipient has few cards, giving them hard-to-play cards is more impactful
    const recipientHandSize = recipient.getHandSize();
    if (recipientHandSize <= 3) {
      score += 5; // Extra value in disrupting someone close to winning
    }

    // Avoid giving 7s — they're too useful for the opponent
    if (card.rank === 7) {
      score -= 25;
    }

    return score;
  }
}
