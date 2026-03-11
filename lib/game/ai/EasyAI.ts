/**
 * EasyAI - Random play strategy
 */

import { BoardState, IAIStrategy, ICard, IPlayer } from '../types/types';

export class EasyAI implements IAIStrategy {
  /**
   * Select a random valid card to play
   */
  public selectCardToPlay(
    hand: ReadonlyArray<ICard>,
    validCards: ReadonlyArray<ICard>,
    boardState: BoardState
  ): ICard {
    if (validCards.length === 0) {
      throw new Error('No valid cards to play');
    }

    // Pick a random card from valid cards
    const randomIndex = Math.floor(Math.random() * validCards.length);
    return validCards[randomIndex];
  }

  /**
   * Select a random card to give to another player
   */
  public selectCardToGive(
    hand: ReadonlyArray<ICard>,
    recipient: IPlayer,
    boardState: BoardState
  ): ICard {
    if (hand.length === 0) {
      throw new Error('No cards in hand to give');
    }

    // Pick a random card from hand
    const randomIndex = Math.floor(Math.random() * hand.length);
    return hand[randomIndex];
  }
}
