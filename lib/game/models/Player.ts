/**
 * Abstract Player class and concrete implementations
 */

import { ICard, IPlayer, PlayerType } from '../types/types';
import { Card } from './Card';

/**
 * Abstract base Player class
 */
export abstract class Player implements IPlayer {
  public readonly id: string;
  public readonly name: string;
  public readonly type: PlayerType;
  public readonly seatPosition: number;
  public finishPosition: number | null;

  protected hand: ICard[];

  constructor(id: string, name: string, type: PlayerType, seatPosition: number) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.seatPosition = seatPosition;
    this.finishPosition = null;
    this.hand = [];
  }

  /**
   * Get a readonly copy of the player's hand
   */
  public getHand(): ReadonlyArray<ICard> {
    return [...this.hand];
  }

  /**
   * Add a card to the player's hand
   */
  public addCard(card: ICard): void {
    this.hand.push(card);
  }

  /**
   * Remove a card from the player's hand
   * @returns true if card was found and removed, false otherwise
   */
  public removeCard(card: ICard): boolean {
    const index = this.hand.findIndex((c) => c.equals(card));
    if (index === -1) {
      return false;
    }
    this.hand.splice(index, 1);
    return true;
  }

  /**
   * Check if the player has a specific card
   */
  public hasCard(card: ICard): boolean {
    return this.hand.some((c) => c.equals(card));
  }

  /**
   * Get the number of cards in the player's hand
   */
  public getHandSize(): number {
    return this.hand.length;
  }

  /**
   * Check if the player's hand is empty
   */
  public isEmpty(): boolean {
    return this.hand.length === 0;
  }

  /**
   * Set multiple cards at once (used during dealing)
   */
  public setHand(cards: ICard[]): void {
    this.hand = [...cards];
  }

  /**
   * Check if the player has the 7 of spades
   */
  public hasSevenOfSpades(): boolean {
    return this.hand.some((card) => {
      return card.suit === 'spades' && card.rank === 7;
    });
  }
}

/**
 * Human player implementation
 */
export class HumanPlayer extends Player {
  constructor(id: string, name: string, seatPosition: number) {
    super(id, name, PlayerType.HUMAN, seatPosition);
  }
}

/**
 * AI player base class (abstract)
 */
export abstract class AIPlayer extends Player {
  constructor(id: string, name: string, type: PlayerType, seatPosition: number) {
    super(id, name, type, seatPosition);
  }
}
