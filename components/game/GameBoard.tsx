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
  myPlayer: IPlayer;
  isMyTurn: boolean;
  onPlayCard: (card: ICard) => void;
  onCannotPlay: () => void;
  onCardTransfer: (card: ICard) => void;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  showValidCards: boolean;
  header?: React.ReactNode;
  opponentsInfo?: React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SUIT_NAMES: Record<Suit, "hearts" | "diamonds" | "clubs" | "spades"> = {
  [Suit.HEARTS]: "hearts",
  [Suit.DIAMONDS]: "diamonds",
  [Suit.CLUBS]: "clubs",
  [Suit.SPADES]: "spades",
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.HEARTS]: "\u2665",
  [Suit.DIAMONDS]: "\u2666",
  [Suit.CLUBS]: "\u2663",
  [Suit.SPADES]: "\u2660",
};

const SUIT_COLORS: Record<Suit, string> = {
  [Suit.HEARTS]: "text-red-500",
  [Suit.DIAMONDS]: "text-red-500",
  [Suit.CLUBS]: "text-slate-300",
  [Suit.SPADES]: "text-slate-300",
};

const SUITS_ORDER = [Suit.SPADES, Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS];

function getRankName(rank: number): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return rank.toString();
}

function getRankNameFull(rank: number): string {
  if (rank === 1) return "Ace";
  if (rank === 11) return "Jack";
  if (rank === 12) return "Queen";
  if (rank === 13) return "King";
  return rank.toString();
}

function getSuitDisplayName(suit: string): string {
  return suit.charAt(0).toUpperCase() + suit.slice(1);
}

/** Sort cards by suit order (spades, hearts, diamonds, clubs), then by rank ascending. */
function sortHand(hand: ReadonlyArray<ICard>): ICard[] {
  const suitOrder: Record<string, number> = {
    [Suit.SPADES]: 0,
    [Suit.HEARTS]: 1,
    [Suit.DIAMONDS]: 2,
    [Suit.CLUBS]: 3,
  };
  return [...hand].sort((a, b) => {
    const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return a.rank - b.rank;
  });
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
  const [playedCardKey, setPlayedCardKey] = useState<string | null>(null);

  const myHand = sortHand(myPlayer.getHand());

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
      setPlayedCardKey(`${card.suit}-${card.rank}`);
      setTimeout(() => {
        onPlayCard(card);
        setPlayedCardKey(null);
        setInvalidClickCount(0);
        setForceShowValid(false);
      }, 300);
    } catch (error: any) {
      const msg = error.message || error.toString();
      const cardName = `${getRankNameFull(card.rank)} of ${getSuitDisplayName(card.suit)}`;

      if (msg.includes("Spades suit is locked") || msg.includes("locked by spades")) {
        addToast("Spades are locked! Play a 7 in any suit first to unlock them.", "warning");
      } else if (msg.includes("must be adjacent") || msg.includes("adjacent to")) {
        const seq = gameState.board[card.suit as Suit];
        if (seq.low !== null && seq.high !== null) {
          const lo = seq.low - 1;
          const hi = seq.high + 1;
          if (lo >= 1 && hi <= 13) {
            addToast(`${cardName} can't be played yet. ${getSuitDisplayName(card.suit)} needs ${getRankNameFull(lo)} or ${getRankNameFull(hi)} next.`, "warning");
          } else if (lo < 1) {
            addToast(`${cardName} can't be played yet. ${getSuitDisplayName(card.suit)} needs ${getRankNameFull(hi)} next.`, "warning");
          } else {
            addToast(`${cardName} can't be played yet. ${getSuitDisplayName(card.suit)} needs ${getRankNameFull(lo)} next.`, "warning");
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

  // ── Group hand by suit for rendering ──

  const handBySuit: { suit: Suit; cards: ICard[] }[] = [];
  let currentSuit: Suit | null = null;
  for (const card of myHand) {
    if (card.suit !== currentSuit) {
      currentSuit = card.suit as Suit;
      handBySuit.push({ suit: currentSuit, cards: [] });
    }
    handBySuit[handBySuit.length - 1].cards.push(card);
  }

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

      <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Mode-specific header */}
        {header}

        {/* Turn indicator banner */}
        <div
          role="status"
          aria-live="polite"
          className={`text-center py-2 text-sm font-semibold transition-colors ${
            isMyTurn
              ? "bg-emerald-500/20 text-emerald-400 animate-pulse"
              : "bg-slate-800/50 text-slate-400"
          }`}
        >
          {isMyTurn ? "Your Turn — Play a card" : `Waiting for ${gameState.players[gameState.currentPlayerIndex]?.name}...`}
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col p-4 gap-4">
          {/* Mode-specific opponents info */}
          {opponentsInfo}

          {/* Board */}
          <div className="flex-1 w-full max-w-7xl mx-auto" role="region" aria-label="Game board">
            <div className="grid grid-cols-4 gap-3 h-full">
              {SUITS_ORDER.map((suit) => {
                const sequence = gameState.board[suit];
                const isOpen = sequence.low !== null && sequence.high !== null;
                const cardCount = isOpen ? sequence.high! - sequence.low! + 1 : 0;

                // Show all cards in the run (low to high)
                const displayCards: number[] = [];
                if (isOpen) {
                  for (let r = sequence.low!; r <= sequence.high!; r++) {
                    displayCards.push(r);
                  }
                }

                return (
                  <div
                    key={suit}
                    role="region"
                    aria-label={`${getSuitDisplayName(suit)} — ${isOpen ? `${cardCount} cards played` : "not started"}`}
                    className={`rounded-xl p-3 flex flex-col transition-all ${
                      isOpen
                        ? "bg-slate-800/60 border border-slate-700"
                        : "bg-slate-800/30 border border-slate-800 border-dashed"
                    }`}
                  >
                    {/* Suit header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl ${SUIT_COLORS[suit]}`}>
                          {SUIT_SYMBOLS[suit]}
                        </span>
                        <span className="font-semibold text-slate-300 text-sm">
                          {getSuitDisplayName(suit)}
                        </span>
                      </div>
                      {isOpen && (
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                          {cardCount} cards
                        </span>
                      )}
                    </div>

                    {/* Card display area */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      {!isOpen ? (
                        <div className="text-sm text-slate-600 italic">
                          Play 7{SUIT_SYMBOLS[suit]} to open
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 w-full">
                          {/* Visual card stack showing full run */}
                          <div className="relative flex items-end justify-center" style={{
                            minHeight: `${displayCards.length * 14 + 70}px`,
                            width: "100%",
                          }}>
                            {displayCards.map((rank, idx) => (
                              <div
                                key={`${suit}-${rank}`}
                                className="absolute left-1/2 -translate-x-1/2"
                                style={{
                                  bottom: `${idx * 14}px`,
                                  zIndex: idx,
                                }}
                              >
                                <Card suit={SUIT_NAMES[suit]} rank={rank} size="small" />
                              </div>
                            ))}
                          </div>
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
        <div className="w-full border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-md" role="region" aria-label={`Your hand — ${myHand.length} cards`}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-400">
                Your Hand
                <span className="ml-2 text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">
                  {myHand.length} cards
                </span>
              </p>
              <button
                onClick={handleCannotPlayClick}
                disabled={!isMyTurn}
                aria-label="Cannot play — pass turn and give a card"
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  isMyTurn
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed"
                }`}
              >
                {"Can't Play"}
              </button>
            </div>

            {/* Card hand — grouped by suit with overlap */}
            <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {handBySuit.map(({ suit, cards }, groupIdx) => (
                <div key={suit} className={`flex-shrink-0 ${groupIdx > 0 ? "border-l border-slate-700/50 pl-6" : ""}`}>
                  {/* Suit label */}
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`text-xs ${SUIT_COLORS[suit]}`}>
                      {SUIT_SYMBOLS[suit]}
                    </span>
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                      {getSuitDisplayName(suit)}
                    </span>
                  </div>
                  {/* Overlapping cards */}
                  <div className="flex" style={{ marginRight: `${Math.max(0, (cards.length - 1)) * -16}px` }}>
                    {cards.map((card: ICard, index: number) => (
                      <div
                        key={`${card.suit}-${card.rank}`}
                        className={`flex-shrink-0 transition-transform hover:!-translate-y-2 hover:!z-50 ${
                          playedCardKey === `${card.suit}-${card.rank}` ? "animate-card-played" : ""
                        }`}
                        style={{
                          marginLeft: index === 0 ? 0 : -16,
                          zIndex: index,
                        }}
                      >
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
