"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/lib/store/gameStore";
import { GameBoard } from "@/components/game/GameBoard";
import { DealingAnimation } from "@/components/game/DealingAnimation";
import { PlayerType, GameMode } from "@/lib/game/types/types";
import { recordGame } from "@/lib/stats/gameStats";

function GamePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") as "easy" | "hard" || "easy";

  const [isDealing, setIsDealing] = useState(true);
  const [statsRecorded, setStatsRecorded] = useState(false);

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
    setIsDealing(true);
  }, [mode, initializeGame, dealCards]);

  const handleDealingComplete = useCallback(() => {
    setIsDealing(false);
  }, []);

  // Record game stats when game finishes
  useEffect(() => {
    if (!gameState || gameState.gamePhase !== "finished" || statsRecorded) return;
    const human = gameState.players.find((p) => p.type === PlayerType.HUMAN);
    if (!human) return;

    const position = gameState.rankings.indexOf(human.id) + 1;
    recordGame({
      date: new Date().toISOString(),
      won: position === 1,
      mode: mode as "easy" | "hard",
      finishPosition: position,
      playerCount: gameState.players.length,
      turnsPlayed: 0, // not tracked yet
    });
    setStatsRecorded(true);
  }, [gameState?.gamePhase, gameState?.rankings, statsRecorded, mode]);

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading game...</p>
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
    setIsDealing(true);
    setStatsRecorded(false);
  };

  if (isDealing) {
    return (
      <DealingAnimation
        playerCount={2}
        playerNames={["You", "AI"]}
        onComplete={handleDealingComplete}
      />
    );
  }

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
        <header className="relative z-10 flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <Link href="/setup">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">
              Sevens - {mode === "easy" ? "Easy Mode" : "Hard Mode"}
            </h1>
          </div>
          {/* Spacer to balance the header */}
          <div className="w-20" />
        </header>
      }
      opponentsInfo={
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              AI
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">{aiPlayer?.name}</div>
              <div className="text-xs text-slate-400">{aiPlayer?.getHandSize() || 0} cards remaining</div>
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-slate-400">Loading game...</p>
          </div>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}
