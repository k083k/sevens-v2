/**
 * Core type definitions for the Sevens card game
 */

/**
 * Game mode difficulty
 */
export enum GameMode {
  EASY = 'easy',   // Must play if you have valid cards
  HARD = 'hard',   // Can choose to pass even with valid cards (strategic)
}

/**
 * Card suits in the game
 */
export enum Suit {
  SPADES = 'spades',
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
}

/**
 * Card ranks (1 = Ace, 11 = Jack, 12 = Queen, 13 = King)
 */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/**
 * Immutable card representation
 */
export interface ICard {
  readonly suit: Suit;
  readonly rank: Rank;
  equals(other: ICard): boolean;
  toString(): string;
  isSeven(): boolean;
  isSevenOfSpades(): boolean;
}

/**
 * Board state for a single suit
 */
export interface SuitSequence {
  low: Rank | null;  // Lowest rank played (null if suit not opened)
  high: Rank | null; // Highest rank played (null if suit not opened)
}

/**
 * Complete board state tracking all four suits
 */
export type BoardState = {
  [key in Suit]: SuitSequence;
};

/**
 * Player types
 */
export enum PlayerType {
  HUMAN = 'human',
  AI_EASY = 'ai_easy',
  AI_HARD = 'ai_hard',
}

/**
 * Base player interface
 */
export interface IPlayer {
  readonly id: string;
  readonly name: string;
  readonly type: PlayerType;
  readonly seatPosition: number;
  finishPosition: number | null;

  getHand(): ReadonlyArray<ICard>;
  addCard(card: ICard): void;
  removeCard(card: ICard): boolean;
  hasCard(card: ICard): boolean;
  getHandSize(): number;
  isEmpty(): boolean;
  hasSevenOfSpades(): boolean;
  setHand(cards: ICard[]): void;
}

/**
 * Game phase states
 */
export enum GamePhase {
  NOT_STARTED = 'not_started',
  DEALING = 'dealing',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

/**
 * Card transfer pending state (when a player cannot play)
 */
export interface PendingCardTransfer {
  readonly from: string; // Player ID giving the card
  readonly to: string;   // Player ID receiving the card
}

/**
 * Complete game state
 */
export interface GameState {
  readonly players: ReadonlyArray<IPlayer>;
  readonly board: BoardState;
  readonly currentPlayerIndex: number;
  readonly turnOrder: ReadonlyArray<string>; // Player IDs in clockwise order
  readonly gamePhase: GamePhase;
  readonly gameMode: GameMode; // Easy or Hard mode
  readonly rankings: ReadonlyArray<string>; // Player IDs in finish order
  readonly pendingCardTransfer: PendingCardTransfer | null;
  readonly validCards?: ReadonlyArray<ICard>; // Valid cards for current player (Easy mode)
}

/**
 * Valid move result
 */
export interface ValidMoveResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

/**
 * AI difficulty levels
 */
export enum AIDifficulty {
  EASY = 'easy',
  HARD = 'hard',
}

/**
 * AI strategy interface
 */
export interface IAIStrategy {
  selectCardToPlay(
    hand: ReadonlyArray<ICard>,
    validCards: ReadonlyArray<ICard>,
    boardState: BoardState
  ): ICard;

  selectCardToGive(
    hand: ReadonlyArray<ICard>,
    recipient: IPlayer,
    boardState: BoardState
  ): ICard;
}
