"use client";

/**
 * GameBoard — Shared game board component used by both single-player and multiplayer.
 *
 * This component owns the board rendering, hand rendering, modals, and toasts.
 * Mode-specific behavior (AI turns, server actions, etc.) lives in the parent pages.
 */

import { useState } from "react";
import { Card } from "./Card";
import { CardTransferModal } from "./CardTransferModal";
import { GameOverModal } from "./GameOverModal";
import { ToastContainer } from "./Toast";
import { Suit, ICard, IPlayer, GameState } from "@/lib/game/types/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  message: string;
  type?: "info" | "warning" | "success";
}

export interface GameBoardProps {
  gameState: GameState;

  /** The player whose hand is shown at the bottom. */
  myPlayer: IPlayer;

  /** Whether it's currently the local player's turn. */
  isMyTurn: boolean;

  /** Callback when the player clicks a card in their hand. */
  onPlayCard: (card: ICard) => void;

  /** Callback when the player clicks "Can't Play". */
  onCannotPlay: () => void;

  /** Callback when the player selects a card to give in a transfer. */
  onCardTransfer: (card: ICard) => void;

  /** Callback when the player clicks "Play Again" on the game-over screen. */
  onPlayAgain: () => void;

  /** Callback when the player clicks "Menu" / "Back" on the game-over screen. */
  onBackToMenu: () => void;

  /**
   * Whether to show valid-card highlights.
   * In easy mode this is always true; in hard mode it can be toggled
   * after repeated invalid attempts.
   */
  showValidCards: boolean;

  /** Optional header content rendered above the board (mode-specific). */
  header?: React.ReactNode;

  /** Optional opponents info rendered above the board (mode-specific). */
  opponentsInfo?: React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SUIT_NAMES: Record<Suit, "hearts" | "diamonds" | "clubs" | "spades"> = {
  [Suit.HEARTS]: "hearts",
  [Suit.DIAMONDS]: "diamonds",
  [Suit.CLUBS]: "clubs",
  [Suit.SPADES]: "spades",
};

const SUITS_ORDER = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

function getRankName(rank: number): string {
  if (rank === 1) return "Ace";
  if (rank === 11) return "Jack";
  if (rank === 12) return "Queen";
  if (rank === 13) return "King";
  return rank.toString();
}

function getSuitDisplayName(suit: string): string {
  return suit.charAt(0).toUpperCase() + suit.slice(1);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GameBoard({
  gameState,
  myPlayer,
  isMyTurn,
  onPlayCard,
  onCannotPlay,
  onCardTransfer,
  onPlayAgain,
  onBackToMenu,
  showValidCards,
  header,
  opponentsInfo,
}: GameBoardProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [invalidClickCount, setInvalidClickCount] = useState(0);
  const [forceShowValid, setForceShowValid] = useState(false);

  const myHand = myPlayer.getHand();

  // ── Toast helpers ──

  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Card validity ──

  const isCardValid = (card: ICard): boolean => {
    if (!isMyTurn) return false;
    if ((showValidCards || forceShowValid) && gameState.validCards) {
      return gameState.validCards.some(
        (vc) => vc.suit === card.suit && vc.rank === card.rank
      );
    }
    return false;
  };

  // ── Card click with error feedback ──

  const handleCardClick = (card: ICard) => {
    if (!isMyTurn) {
      addToast("Not your turn!", "warning");
      return;
    }

    try {
      onPlayCard(card);
      setInvalidClickCount(0);
      setForceShowValid(false);
    } catch (error: any) {
      const msg = error.message || error.toString();
      const cardName = `${getRankName(card.rank)} of ${getSuitDisplayName(card.suit)}`;

      if (msg.includes("Spades suit is locked") || msg.includes("locked by spades")) {
        addToast("Spades are locked! Play a 7 in any suit first to unlock them.", "warning");
      } else if (msg.includes("must be adjacent") || msg.includes("adjacent to")) {
        const seq = gameState.board[card.suit as Suit];
        if (seq.low !== null && seq.high !== null) {
          const lo = seq.low - 1;
          const hi = seq.high + 1;
          if (lo >= 1 && hi <= 13) {
            addToast(`${cardName} can't be played yet. ${getSuitDisplayName(card.suit)} needs ${getRankName(lo)} or ${getRankName(hi)} next.`, "warning");
          } else if (lo < 1) {
            addToast(`${cardName} can't be played yet. ${getSuitDisplayName(card.suit)} needs ${getRankName(hi)} next.`, "warning");
          } else {
            addToast(`${cardName} can't be played yet. ${getSuitDisplayName(card.suit)} needs ${getRankName(lo)} next.`, "warning");
          }
        }
      } else if (msg.includes("not opened") || msg.includes("not open")) {
        addToast(`${getSuitDisplayName(card.suit)} hasn't been started yet. Play the 7 of ${getSuitDisplayName(card.suit)} first!`, "warning");
      } else {
        addToast(`${cardName} can't be played right now.`, "warning");
      }

      const newCount = invalidClickCount + 1;
      setInvalidClickCount(newCount);
      if (newCount >= 3) {
        setForceShowValid(true);
        addToast("Valid moves are now highlighted in green!", "info");
      }
    }
  };

  // ── Cannot play ──

  const handleCannotPlayClick = () => {
    if (!isMyTurn) {
      addToast("Not your turn!", "warning");
      return;
    }

    try {
      onCannotPlay();
    } catch (error: any) {
      const msg = error.message || error.toString();
      if (msg.includes("has valid moves")) {
        addToast("You have valid moves available! Try playing a card.", "warning");
        setForceShowValid(true);
      } else {
        addToast(msg, "warning");
      }
    }
  };

  // ── Card transfer ──

  const handleCardTransfer = (card: ICard) => {
    try {
      onCardTransfer(card);
      addToast("Card transferred!", "success");
    } catch (error: any) {
      addToast(error.message || "Error transferring card", "warning");
    }
  };

  // ── Render ──

  return (
    <>
      {/* Landscape Mode Enforcer for Mobile */}
      <div className="md:hidden portrait:flex hidden portrait:fixed portrait:inset-0 portrait:z-50 portrait:bg-slate-900 portrait:items-center portrait:justify-center portrait:p-8">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold mb-2">Please Rotate</h2>
          <p className="text-slate-300">This game is best played in landscape mode</p>
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Mode-specific header */}
        {header}

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center p-4 gap-4">
          {/* Mode-specific opponents info */}
          {opponentsInfo}

          {/* Board */}
          <div className="w-full max-w-6xl flex-1">
            <div className="grid grid-cols-4 gap-4 h-full">
              {SUITS_ORDER.map((suit) => {
                const sequence = gameState.board[suit];
                const lowCards: number[] = [];
                const highCards: number[] = [];

                if (sequence.low !== null && sequence.high !== null) {
                  for (let rank = sequence.low; rank <= sequence.high; rank++) {
                    if (rank >= 7) {
                      highCards.push(rank);
                    } else {
                      lowCards.push(rank);
                    }
                  }
                }

                return (
                  <div
                    key={suit}
                    className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-h-100 flex flex-col"
                  >
                    <h3 className="text-center font-semibold mb-3 text-slate-700 dark:text-slate-300">
                      {getSuitDisplayName(suit)}
                    </h3>
                    <div className="flex-1 flex flex-col items-center justify-end py-2 overflow-y-auto">
                      {highCards.length === 0 && lowCards.length === 0 ? (
                        <div className="text-sm text-slate-500 dark:text-slate-500 italic text-center flex-1 flex items-center">
                          Play a 7 to start
                        </div>
                      ) : (
                        <div
                          className="relative flex items-end justify-center"
                          style={{
                            minHeight: `${Math.max(
                              (lowCards.length + highCards.length) * 20 + 100,
                              120
                            )}px`,
                            width: "100%",
                          }}
                        >
                          {lowCards.map((rank, idx) => (
                            <div
                              key={`${suit}-${rank}`}
                              className="absolute"
                              style={{
                                bottom: `${idx * 20}px`,
                                zIndex: idx,
                              }}
                            >
                              <Card suit={SUIT_NAMES[suit]} rank={rank} size="small" />
                            </div>
                          ))}
                          {highCards.map((rank, idx) => (
                            <div
                              key={`${suit}-${rank}`}
                              className="absolute"
                              style={{
                                bottom: `${(lowCards.length + idx) * 20}px`,
                                zIndex: lowCards.length + idx,
                              }}
                            >
                              <Card suit={SUIT_NAMES[suit]} rank={rank} size="small" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Player Hand — fixed to bottom */}
        <div className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Your Hand ({myHand.length} cards)
              </p>
              <button
                onClick={handleCannotPlayClick}
                disabled={!isMyTurn}
                className="px-3 py-1.5 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Can't Play
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {myHand.map((card: ICard, index: number) => (
                <div key={`${card.suit}-${card.rank}-${index}`} className="flex-shrink-0">
                  <Card
                    suit={SUIT_NAMES[card.suit as Suit]}
                    rank={card.rank}
                    size="small"
                    isValid={isCardValid(card)}
                    disabled={!isMyTurn}
                    onClick={() => handleCardClick(card)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card Transfer Modal */}
        {gameState.pendingCardTransfer &&
          gameState.pendingCardTransfer.from === myPlayer.id && (
            <CardTransferModal
              visible={true}
              fromPlayerName={myPlayer.name}
              toPlayerName={
                gameState.players.find(
                  (p) => p.id === gameState.pendingCardTransfer!.to
                )?.name || "Player"
              }
              availableCards={myHand}
              onSelectCard={handleCardTransfer}
            />
          )}

        {/* Game Over Modal */}
        {gameState.gamePhase === "finished" && (
          <GameOverModal
            visible={true}
            rankings={gameState.rankings}
            players={gameState.players}
            onPlayAgain={onPlayAgain}
            onBackToMenu={onBackToMenu}
          />
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </>
  );
}
