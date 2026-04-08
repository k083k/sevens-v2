"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, X, Eye } from "lucide-react";
import { useMultiplayerStore } from "@/lib/store/multiplayerStore";
import { GameBoard } from "@/components/game/GameBoard";
import { DealingAnimation } from "@/components/game/DealingAnimation";
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
  const [isDealing, setIsDealing] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopySpectateLink = () => {
    const url = `${window.location.origin}/multiplayer/spectate/${gameId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleDealingComplete = useCallback(() => {
    setIsDealing(false);
  }, []);

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

  if (loading || !gameState || isDealing) {
    if (!loading && gameState && isDealing) {
      return (
        <DealingAnimation
          playerCount={gameState.players.length}
          playerNames={gameState.players.map((p) => p.id === playerId ? "You" : p.name)}
          onComplete={handleDealingComplete}
        />
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading game...</p>
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
          <div className="max-w-7xl mx-auto px-4 py-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/")}
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Leave
                </Button>
                {isHost && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEndGameModal(true)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="mr-2 h-4 w-4" />
                    End Game
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySpectateLink}
                  className="text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  {copiedLink ? "Copied!" : "Spectate Link"}
                </Button>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800/50 rounded-lg">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">
                    {gameState.players.length} Players
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
        opponentsInfo={
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {gameState.players.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border transition-all ${
                    index === gameState.currentPlayerIndex
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-200">
                        {player.name}
                        {player.id === playerId && (
                          <span className="ml-1.5 text-xs text-emerald-400">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 ml-9">
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
