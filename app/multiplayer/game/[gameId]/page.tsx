"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, X } from "lucide-react";
import { useMultiplayerStore } from "@/lib/store/multiplayerStore";
import { Card } from "@/components/game/Card";
import { GameMode, Suit } from "@/lib/game/types/types";
import { CardTransferModal } from "@/components/game/CardTransferModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { ToastContainer } from "@/components/game/Toast";
import { EndGameModal } from "@/components/multiplayer/EndGameModal";
import { supabase } from "@/lib/supabase/client";
import { cancelGame } from "@/lib/multiplayer/lobby";

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

  // Toast notifications
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: "info" | "warning" | "success" }>>([]);
  const [showValidMoves, setShowValidMoves] = useState(false);
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
        addToast(error.message || "Failed to initialize game", "warning");
        setLoading(false);
      }
    };

    init();

    // Subscribe to game status changes (for when host ends game)
    const gameStatusChannel = supabase
      .channel(`game_status:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === 'cancelled' || newStatus === 'finished') {
            addToast("Game ended by host", "info");
            setTimeout(() => router.push("/"), 1000);
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      cleanup();
      supabase.removeChannel(gameStatusChannel);
    };
  }, [gameId, mode]);

  const addToast = (message: string, type: "info" | "warning" | "success" = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCardClick = async (card: any) => {
    if (!isMyTurn) {
      addToast("Not your turn!", "warning");
      return;
    }

    try {
      await playCard(card);
      addToast("Card played!", "success");
    } catch (error: any) {
      console.error("Error playing card:", error);
      addToast(error.message || "Cannot play that card", "warning");
    }
  };

  const handleCannotPlayClick = async () => {
    if (!isMyTurn) {
      addToast("Not your turn!", "warning");
      return;
    }

    try {
      await handleCannotPlay();
      addToast("Cannot play - taking card from previous player", "info");
    } catch (error: any) {
      console.error("Error handling cannot play:", error);
      addToast(error.message || "Error", "warning");
    }
  };

  const handleCardTransfer = async (card: any) => {
    try {
      await executeCardTransfer(card);
      addToast("Card transferred!", "success");
    } catch (error: any) {
      console.error("Error transferring card:", error);
      addToast(error.message || "Error transferring card", "warning");
    }
  };

  const handleEndGameClick = () => {
    setShowEndGameModal(true);
  };

  const handleEndGameConfirm = async () => {
    if (!isHost || !playerId) return;

    setShowEndGameModal(false);
    const result = await cancelGame(gameId, playerId);
    if (result.success) {
      addToast("Game ended by host", "info");
      router.push("/");
    } else {
      addToast(result.error || "Failed to end game", "warning");
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
  const myHand = myPlayer?.getHand() || [];

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

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 landscape:pb-48 pb-4">
      {/* Header */}
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
                onClick={handleEndGameClick}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="mr-2 h-4 w-4" />
                End Game
              </Button>
            )}
          </div>

          {/* Turn Indicator */}
          <div className="text-center">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Current Turn
            </div>
            <div className={`text-lg font-bold ${isMyTurn ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}>
              {isMyTurn ? "YOUR TURN" : `${currentPlayer.name}'s turn`}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{gameState.players.length} Players</span>
          </div>
        </div>
      </div>

      {/* Players Info */}
      <div className="max-w-7xl mx-auto mb-3 px-4">
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
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">You</div>
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

      {/* Board */}
      <div className="max-w-7xl mx-auto mb-3 px-4">
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-3">Board</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(gameState.board).map(([suit, sequence]) => {
              const suitName = suit as Suit;
              const cards = [];

              // Generate all cards in the sequence (high to low for visual stacking)
              if (sequence.low !== null && sequence.high !== null) {
                for (let rank = sequence.high; rank >= sequence.low; rank--) {
                  cards.push({ suit: suitName, rank });
                }
              }

              return (
                <div key={suit} className="flex flex-col items-center">
                  <div className="font-medium text-sm mb-3 capitalize">{suit}</div>
                  <div className="flex flex-col items-center min-h-[120px]">
                    {cards.length > 0 ? (
                      <div className="relative">
                        {cards.map((card, idx) => (
                          <div
                            key={idx}
                            className="absolute left-1/2 -translate-x-1/2"
                            style={{
                              top: `${idx * 16}px`,
                              zIndex: idx
                            }}
                          >
                            <Card
                              suit={card.suit}
                              rank={card.rank}
                              size="small"
                            />
                          </div>
                        ))}
                        {/* Spacer to maintain height */}
                        <div style={{ height: `${(cards.length - 1) * 16 + 96}px` }} />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center h-[96px]">
                        Not opened
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* My Hand - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-900/95 to-slate-900/80 backdrop-blur-md border-t border-slate-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Your Hand</h2>
            <Button
              onClick={handleCannotPlayClick}
              disabled={!isMyTurn}
              variant="outline"
              size="sm"
            >
              Can't Play
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {myHand.map((card, index) => (
              <div key={index} className="flex-shrink-0">
                <Card
                  suit={card.suit}
                  rank={card.rank}
                  size="small"
                  onClick={() => handleCardClick(card)}
                  isValid={isMyTurn && (gameState.validCards?.some((c) => c.suit === card.suit && c.rank === card.rank) || false)}
                  disabled={!isMyTurn}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Transfer Modal */}
      {gameState.pendingCardTransfer && gameState.pendingCardTransfer.from === playerId && (
        <CardTransferModal
          isOpen={true}
          onClose={() => {}}
          onCardSelected={handleCardTransfer}
          availableCards={myHand}
          recipientName={
            gameState.players.find((p) => p.id === gameState.pendingCardTransfer!.to)?.name || "Player"
          }
        />
      )}

      {/* Game Over Modal */}
      {gameState.gamePhase === "finished" && (
        <GameOverModal
          isOpen={true}
          onClose={() => router.push("/")}
          onPlayAgain={() => router.push("/setup")}
          rankings={gameState.rankings.map((id) => {
            const player = gameState.players.find((p) => p.id === id);
            return {
              name: player?.name || "Unknown",
              position: player?.finishPosition || 0,
            };
          })}
        />
      )}

      {/* End Game Modal */}
      <EndGameModal
        isOpen={showEndGameModal}
        onClose={() => setShowEndGameModal(false)}
        onConfirm={handleEndGameConfirm}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
    </>
  );
}
