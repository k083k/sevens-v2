/**
 * Deck class for creating, shuffling, and dealing cards
 */

import { Card } from './Card';
import { ICard, Rank, Suit } from '../types/types';
import { GAME_CONFIG } from '../../utils/constants';

export class Deck {
  private cards: Card[];

  constructor() {
    this.cards = this.createDeck();
  }

  /**
   * Create a standard 52-card deck (no jokers)
   */
  private createDeck(): Card[] {
    const deck: Card[] = [];
    const suits = [Suit.SPADES, Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS];
    const ranks: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(new Card(suit, rank));
      }
    }

    return deck;
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Deal cards to players
   * @param numPlayers Number of players (2-4)
   * @returns Array of hands (each hand is an array of cards)
   */
  public deal(numPlayers: number): ICard[][] {
    if (numPlayers < GAME_CONFIG.MIN_PLAYERS || numPlayers > GAME_CONFIG.MAX_PLAYERS) {
      throw new Error(
        `Invalid number of players: ${numPlayers}. Must be between ${GAME_CONFIG.MIN_PLAYERS} and ${GAME_CONFIG.MAX_PLAYERS}.`
      );
    }

    // Reset and shuffle deck
    this.cards = this.createDeck();
    this.shuffle();

    // Initialize hands
    const hands: ICard[][] = Array.from({ length: numPlayers }, () => []);

    // Deal cards one at a time in clockwise order
    let currentPlayer = 0;
    for (const card of this.cards) {
      hands[currentPlayer].push(card);
      currentPlayer = (currentPlayer + 1) % numPlayers;
    }

    return hands;
  }

  /**
   * Get the current number of cards in the deck
   */
  public size(): number {
    return this.cards.length;
  }

  /**
   * Get a copy of the current deck
   */
  public getCards(): ReadonlyArray<ICard> {
    return [...this.cards];
  }

  /**
   * Validate that the deck is correct (52 unique cards, no duplicates)
   */
  public validate(): boolean {
    if (this.cards.length !== GAME_CONFIG.DECK_SIZE) {
      return false;
    }

    // Check for duplicates using a Set with string representation
    const cardStrings = new Set<string>();
    for (const card of this.cards) {
      const cardStr = `${card.suit}-${card.rank}`;
      if (cardStrings.has(cardStr)) {
        return false;
      }
      cardStrings.add(cardStr);
    }

    return true;
  }
}
