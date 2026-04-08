/**
 * Game Stats — Tracks player performance in localStorage.
 *
 * Stores wins, losses, total games, best win streak, current streak,
 * and recent game history.
 */

const STORAGE_KEY = "sevens-game-stats";

export interface GameResult {
  date: string; // ISO string
  won: boolean;
  mode: "easy" | "hard";
  finishPosition: number; // 1 = first, 2 = second, etc.
  playerCount: number;
  turnsPlayed: number;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  currentStreak: number; // positive = win streak, negative = loss streak
  bestWinStreak: number;
  easyWins: number;
  easyGames: number;
  hardWins: number;
  hardGames: number;
  recentGames: GameResult[]; // last 20 games
}

const DEFAULT_STATS: GameStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  currentStreak: 0,
  bestWinStreak: 0,
  easyWins: 0,
  easyGames: 0,
  hardWins: 0,
  hardGames: 0,
  recentGames: [],
};

export function getStats(): GameStats {
  if (typeof window === "undefined") return DEFAULT_STATS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function recordGame(result: GameResult): GameStats {
  const stats = getStats();

  stats.totalGames++;
  if (result.won) {
    stats.wins++;
    stats.currentStreak = Math.max(0, stats.currentStreak) + 1;
    stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentStreak);
  } else {
    stats.losses++;
    stats.currentStreak = Math.min(0, stats.currentStreak) - 1;
  }

  if (result.mode === "easy") {
    stats.easyGames++;
    if (result.won) stats.easyWins++;
  } else {
    stats.hardGames++;
    if (result.won) stats.hardWins++;
  }

  // Keep last 20 games
  stats.recentGames = [result, ...stats.recentGames].slice(0, 20);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }

  return stats;
}

export function resetStats(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getWinRate(stats: GameStats): number {
  if (stats.totalGames === 0) return 0;
  return Math.round((stats.wins / stats.totalGames) * 100);
}
