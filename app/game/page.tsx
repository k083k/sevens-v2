"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/lib/store/gameStore";
import { Card } from "@/components/game/Card";
import { PlayerType, GameMode, Suit } from "@/lib/game/types/types";
import { CardTransferModal } from "@/components/game/CardTransferModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { ToastContainer } from "@/components/game/Toast";

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") as "easy" | "hard" || "easy";

  const { gameState, initializeGame, dealCards, playCard, handleCannotPlay, executeCardTransfer, processAITurn, processAICardGiving, resetGame } = useGameStore();

  // Toast notifications
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: "info" | "warning" | "success" }>>([]);
  const [invalidClickCount, setInvalidClickCount] = useState(0);
  const [showValidMoves, setShowValidMoves] = useState(false);

  // Initialize game on mount
  useEffect(() => {
    initializeGame(
      [
        { name: "You", type: PlayerType.HUMAN },
        { name: "AI", type: PlayerType.AI_EASY },
      ],
      mode === "easy" ? GameMode.EASY : GameMode.HARD
    );
    dealCards();
  }, [mode, initializeGame, dealCards]);

  // Process AI turns
  useEffect(() => {
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (currentPlayer?.type !== PlayerType.HUMAN && gameState.gamePhase === "playing") {
      const timer = setTimeout(() => {
        processAITurn();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.currentPlayerIndex, gameState?.gamePhase, processAITurn]);

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading game...</p>
        </div>
      </div>
    );
  }

  const humanPlayer = gameState.players.find((p) => p.type === PlayerType.HUMAN);
  const aiPlayer = gameState.players.find((p) => p.type !== PlayerType.HUMAN);
  const isHumanTurn = gameState.players[gameState.currentPlayerIndex]?.type === PlayerType.HUMAN;
  const humanHand = humanPlayer?.getHand() || [];
  const aiHandSize = aiPlayer?.getHandSize() || 0;

  const getSuitSequence = (suit: Suit) => {
    return gameState.board[suit];
  };

  const addToast = (message: string, type: "info" | "warning" | "success" = "info") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getRankName = (rank: number): string => {
    if (rank === 1) return "Ace";
    if (rank === 11) return "Jack";
    if (rank === 12) return "Queen";
    if (rank === 13) return "King";
    return rank.toString();
  };

  const getSuitName = (suit: string): string => {
    return suit.charAt(0).toUpperCase() + suit.slice(1);
  };

  const handleCardClick = (card: any) => {
    if (!isHumanTurn) return;
    try {
      playCard(card);
      setInvalidClickCount(0); // Reset on successful play
      setShowValidMoves(false);
    } catch (error: any) {
      console.error("Error playing card:", error);

      // Increment invalid click count
      setInvalidClickCount(prev => prev + 1);

      // Show helpful message based on the error
      const errorMessage = error.message || error.toString();
      const cardName = `${getRankName(card.rank)} of ${getSuitName(card.suit)}`;

      if (errorMessage.includes("Spades suit is locked")) {
        addToast("Spades are locked! Play a 7 in any suit first to unlock them.", "warning");
      } else if (errorMessage.includes("must be adjacent")) {
        // Get current sequence for this suit
        const sequence = gameState.board[card.suit as Suit];
        if (sequence.low !== null && sequence.high !== null) {
          const nextLow = sequence.low - 1;
          const nextHigh = sequence.high + 1;

          if (nextLow >= 1 && nextHigh <= 13) {
            addToast(
              `${cardName} can't be played yet. ${getSuitName(card.suit)} needs ${getRankName(nextLow)} or ${getRankName(nextHigh)} next.`,
              "warning"
            );
          } else if (nextLow < 1) {
            addToast(
              `${cardName} can't be played yet. ${getSuitName(card.suit)} needs ${getRankName(nextHigh)} next (can't go below Ace).`,
              "warning"
            );
          } else {
            addToast(
              `${cardName} can't be played yet. ${getSuitName(card.suit)} needs ${getRankName(nextLow)} next (can't go above King).`,
              "warning"
            );
          }
        }
      } else if (errorMessage.includes("Suit not opened")) {
        addToast(`${getSuitName(card.suit)} hasn't been started yet. Play the 7 of ${getSuitName(card.suit)} first!`, "warning");
      } else if (errorMessage.includes("not in hand") || errorMessage.includes("does not have")) {
        addToast(`You don't have that card.`, "warning");
      } else {
        // More specific generic message
        addToast(`${cardName} can't be played right now. Check the board for valid moves.`, "warning");
      }

      // After 3 invalid attempts, highlight valid moves
      if (invalidClickCount >= 2) {
        setShowValidMoves(true);
        addToast("Valid moves are now highlighted in green!", "info");
      }
    }
  };

  const isCardValid = (card: any) => {
    if (!isHumanTurn) return false;
    // Show valid moves in easy mode OR if user has made multiple invalid attempts
    if ((mode === "easy" || showValidMoves) && gameState.validCards) {
      return gameState.validCards.some((vc: any) => vc.suit === card.suit && vc.rank === card.rank);
    }
    return false; // Don't highlight in hard mode unless showValidMoves is true
  };

  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const suitNames: Record<Suit, string> = {
    [Suit.HEARTS]: "hearts",
    [Suit.DIAMONDS]: "diamonds",
    [Suit.CLUBS]: "clubs",
    [Suit.SPADES]: "spades",
  };

  const handlePlayAgain = () => {
    resetGame();
    initializeGame(
      [
        { name: "You", type: PlayerType.HUMAN },
        { name: "AI", type: PlayerType.AI_EASY },
      ],
      mode === "easy" ? GameMode.EASY : GameMode.HARD
    );
    dealCards();
  };

  const handleBackToMenu = () => {
    router.push("/setup");
  };

  const handleCardTransfer = (card: any) => {
    try {
      executeCardTransfer(card);
      addToast("Card transferred successfully!", "success");
    } catch (error: any) {
      console.error("Error transferring card:", error);
      addToast(`Error: ${error.message || error}`, "warning");
    }
  };

  const handleCannotPlayClick = () => {
    try {
      handleCannotPlay();
      addToast("You cannot play. AI is giving you a card...", "info");

      // AI automatically gives a card after a brief delay
      setTimeout(() => {
        processAICardGiving();
      }, 1000);
    } catch (error: any) {
      console.error("Error handling cannot play:", error);
      const errorMessage = error.message || error.toString();

      if (errorMessage.includes("has valid moves")) {
        addToast("You have valid moves available! Try playing a card.", "warning");
        // Highlight valid moves to help the user
        setShowValidMoves(true);
      } else {
        addToast(errorMessage, "warning");
      }
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <Link href="/setup">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Sevens - {mode === "easy" ? "Easy Mode" : "Hard Mode"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isHumanTurn ? "Your Turn" : "AI's Turn"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCannotPlayClick}
          disabled={!isHumanTurn}
        >
          Cannot Play
        </Button>
      </header>

      {/* Game board */}
      <main className="flex-1 flex flex-col items-center p-4 gap-6">
        {/* AI Player Info */}
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {aiPlayer?.name}: {aiHandSize} cards
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="w-full max-w-6xl flex-1">
          <div className="grid grid-cols-4 gap-4 h-full">
            {suits.map((suit) => {
              const sequence = getSuitSequence(suit);
              // Generate two arrays: one for cards >= 7, one for cards < 7
              const highCards: number[] = []; // 7, 8, 9, 10, etc
              const lowCards: number[] = [];  // 6, 5, 4, etc (reversed)

              if (sequence.low !== null && sequence.high !== null) {
                for (let rank = sequence.low; rank <= sequence.high; rank++) {
                  if (rank >= 7) {
                    highCards.push(rank);
                  } else {
                    lowCards.push(rank);
                  }
                }
                // Don't reverse - we want 5, 6 in order from bottom to top
              }

              return (
                <div
                  key={suit}
                  className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-h-100 flex flex-col"
                >
                  <h3 className="text-center font-semibold mb-3 text-slate-700 dark:text-slate-300">
                    {suit.charAt(0).toUpperCase() + suit.slice(1)}
                  </h3>
                  <div className="flex-1 flex flex-col items-center justify-end py-2 overflow-y-auto">
                    {highCards.length === 0 && lowCards.length === 0 ? (
                      <div className="text-sm text-slate-500 dark:text-slate-500 italic text-center flex-1 flex items-center">
                        Play a 7 to start
                      </div>
                    ) : (
                      <div className="relative flex items-end justify-center" style={{
                        minHeight: `${Math.max((lowCards.length + highCards.length) * 20 + 100, 120)}px`,
                        width: '100%'
                      }}>
                        {/* First show low cards (6, 5, 4, etc) at the bottom */}
                        {lowCards.map((rank, index) => {
                          // Low cards go at bottom: 5 at 0px, 6 at 20px, etc
                          const positionFromBottom = index * 20;
                          return (
                            <div
                              key={`${suit}-${rank}`}
                              className="absolute"
                              style={{
                                bottom: `${positionFromBottom}px`,
                                zIndex: index
                              }}
                            >
                              <Card
                                suit={suitNames[suit as Suit] as "hearts" | "diamonds" | "clubs" | "spades"}
                                rank={rank}
                                size="small"
                              />
                            </div>
                          );
                        })}
                        {/* Then show high cards (7, 8, 9, etc) above low cards */}
                        {highCards.map((rank, index) => {
                          // High cards start after low cards: 7 at lowCards.length*20, 8 at (lowCards.length+1)*20, etc
                          const positionFromBottom = (lowCards.length + index) * 20;
                          return (
                            <div
                              key={`${suit}-${rank}`}
                              className="absolute"
                              style={{
                                bottom: `${positionFromBottom}px`,
                                zIndex: lowCards.length + index
                              }}
                            >
                              <Card
                                suit={suitNames[suit as Suit] as "hearts" | "diamonds" | "clubs" | "spades"}
                                rank={rank}
                                size="small"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Human Player Hand - Fixed to bottom */}
      <div className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-4 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Your Hand ({humanHand.length} cards)
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {humanHand.map((card: any, index: number) => (
              <div key={`${card.suit}-${card.rank}-${index}`} className="flex-shrink-0">
                <Card
                  suit={suitNames[card.suit as Suit] as "hearts" | "diamonds" | "clubs" | "spades"}
                  rank={card.rank}
                  size="small"
                  isValid={isCardValid(card)}
                  disabled={!isHumanTurn}
                  onClick={() => handleCardClick(card)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CardTransferModal
        visible={!!gameState.pendingCardTransfer &&
                 gameState.pendingCardTransfer.from === humanPlayer?.id}
        fromPlayerName={humanPlayer?.name || ""}
        toPlayerName={
          gameState.pendingCardTransfer
            ? gameState.players.find((p) => p.id === gameState.pendingCardTransfer!.to)?.name || ""
            : ""
        }
        availableCards={humanHand}
        onSelectCard={handleCardTransfer}
      />

      <GameOverModal
        visible={gameState.gamePhase === "finished"}
        rankings={gameState.rankings}
        players={gameState.players}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading game...</p>
        </div>
      </div>
    }>
      <GamePageContent />
    </Suspense>
  );
}
