"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/lib/store/gameStore";
import { GameBoard } from "@/components/game/GameBoard";
import { PlayerType, GameMode } from "@/lib/game/types/types";

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") as "easy" | "hard" || "easy";

  const {
    gameState,
    initializeGame,
    dealCards,
    playCard,
    handleCannotPlay,
    executeCardTransfer,
    processAITurn,
    processAICardGiving,
    resetGame,
  } = useGameStore();

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

  if (!humanPlayer) return null;

  const handleCannotPlayWithAI = () => {
    handleCannotPlay();
    // AI automatically gives a card after a brief delay
    setTimeout(() => {
      processAICardGiving();
    }, 1000);
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

  return (
    <GameBoard
      gameState={gameState}
      myPlayer={humanPlayer}
      isMyTurn={isHumanTurn}
      onPlayCard={playCard}
      onCannotPlay={handleCannotPlayWithAI}
      onCardTransfer={executeCardTransfer}
      onPlayAgain={handlePlayAgain}
      onBackToMenu={() => router.push("/setup")}
      showValidCards={mode === "easy"}
      header={
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
          {/* Spacer to balance the header */}
          <div className="w-20" />
        </header>
      }
      opponentsInfo={
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {aiPlayer?.name}: {aiPlayer?.getHandSize() || 0} cards
            </div>
          </div>
        </div>
      }
    />
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading game...</p>
          </div>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}
