/**
 * Concrete AI Player implementations
 */

import { AIPlayer } from './Player';
import { PlayerType, IAIStrategy, ICard, BoardState, IPlayer } from '../types/types';
import { EasyAI } from '../ai/EasyAI';
import { HardAI } from '../ai/HardAI';

/**
 * Easy AI player using random strategy
 */
export class EasyAIPlayer extends AIPlayer {
  private strategy: IAIStrategy;

  constructor(id: string, name: string, seatPosition: number) {
    super(id, name, PlayerType.AI_EASY, seatPosition);
    this.strategy = new EasyAI();
  }

  public selectCardToPlay(validCards: ReadonlyArray<ICard>, boardState: BoardState): ICard {
    return this.strategy.selectCardToPlay(this.getHand(), validCards, boardState);
  }

  public selectCardToGive(recipient: IPlayer, boardState: BoardState): ICard {
    return this.strategy.selectCardToGive(this.getHand(), recipient, boardState);
  }
}

/**
 * Hard AI player using strategic decision-making
 */
export class HardAIPlayer extends AIPlayer {
  private strategy: IAIStrategy;

  constructor(id: string, name: string, seatPosition: number) {
    super(id, name, PlayerType.AI_HARD, seatPosition);
    this.strategy = new HardAI();
  }

  public selectCardToPlay(validCards: ReadonlyArray<ICard>, boardState: BoardState): ICard {
    return this.strategy.selectCardToPlay(this.getHand(), validCards, boardState);
  }

  public selectCardToGive(recipient: IPlayer, boardState: BoardState): ICard {
    return this.strategy.selectCardToGive(this.getHand(), recipient, boardState);
  }
}
