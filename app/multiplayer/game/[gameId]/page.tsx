"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, X } from "lucide-react";
import { useMultiplayerStore } from "@/lib/store/multiplayerStore";
import { GameBoard } from "@/components/game/GameBoard";
import { GameMode } from "@/lib/game/types/types";
import { EndGameModal } from "@/components/multiplayer/EndGameModal";
import { supabase } from "@/lib/supabase/client";
import { cancelGame } from "@/lib/actions/lobby-actions";

export default function MultiplayerGamePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const gameId = params.gameId as string;
  const mode = (searchParams.get("mode") as "easy" | "hard") || "easy";

  const {
    gameState,
    playerId,
    isMyTurn,
    initializeMultiplayerGame,
    playCard,
    handleCannotPlay,
    executeCardTransfer,
    cleanup,
  } = useMultiplayerStore();

  const [isHost, setIsHost] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize game on mount
  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem("playerId");
    if (!storedPlayerId) {
      router.push("/");
      return;
    }

    const init = async () => {
      try {
        // Check if this player is host
        const result = await supabase
          .from("game_players")
          .select("is_host")
          .eq("game_id", gameId)
          .eq("player_id", storedPlayerId)
          .maybeSingle();

        if (result.data) {
          setIsHost(Boolean((result.data as any).is_host));
        }

        await initializeMultiplayerGame(
          gameId,
          storedPlayerId,
          mode === "easy" ? GameMode.EASY : GameMode.HARD
        );
        setLoading(false);
      } catch (error: any) {
        console.error("Error initializing game:", error);
        setLoading(false);
      }
    };

    init();

    // Subscribe to game status changes (for when host ends game)
    const gameStatusChannel = supabase
      .channel(`game_status:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === "cancelled" || newStatus === "finished") {
            setTimeout(() => router.push("/"), 1000);
          }
        }
      )
      .subscribe();

    return () => {
      cleanup();
      supabase.removeChannel(gameStatusChannel);
    };
  }, [gameId, mode]);

  const handleEndGameConfirm = async () => {
    if (!isHost || !playerId) return;
    setShowEndGameModal(false);

    const result = await cancelGame(gameId, playerId);
    if (result.success) {
      router.push("/");
    }
  };

  if (loading || !gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading game...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const myPlayer = gameState.players.find((p) => p.id === playerId);

  if (!myPlayer) return null;

  return (
    <>
      <GameBoard
        gameState={gameState}
        myPlayer={myPlayer}
        isMyTurn={isMyTurn}
        onPlayCard={playCard}
        onCannotPlay={handleCannotPlay}
        onCardTransfer={executeCardTransfer}
        onPlayAgain={() => router.push("/setup")}
        onBackToMenu={() => router.push("/")}
        showValidCards={mode === "easy"}
        header={
          <div className="max-w-7xl mx-auto mb-2 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Leave
                </Button>
                {isHost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEndGameModal(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    End Game
                  </Button>
                )}
              </div>

              <div className="text-center">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Current Turn
                </div>
                <div
                  className={`text-lg font-bold ${
                    isMyTurn
                      ? "text-emerald-600"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {isMyTurn ? "YOUR TURN" : `${currentPlayer.name}'s turn`}
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {gameState.players.length} Players
                </span>
              </div>
            </div>
          </div>
        }
        opponentsInfo={
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {gameState.players.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    index === gameState.currentPlayerIndex
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{player.name}</div>
                      {player.id === playerId && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          You
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {player.getHandSize()} cards
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      />

      {/* End Game Modal (multiplayer only) */}
      <EndGameModal
        isOpen={showEndGameModal}
        onClose={() => setShowEndGameModal(false)}
        onConfirm={handleEndGameConfirm}
      />
    </>
  );
}
