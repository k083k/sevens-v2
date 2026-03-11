/**
 * Application-wide constants
 * Centralized configuration for easy maintenance and updates
 */

export const APP_CONFIG = {
  // App name - change this single value to update throughout the application
  APP_NAME: 'sevens-game',
  APP_DISPLAY_NAME: 'Sevens',
  VERSION: '1.0.0',
} as const;

export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  DECK_SIZE: 52,
  CARDS_PER_SUIT: 13,
} as const;
