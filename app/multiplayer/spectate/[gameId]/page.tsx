"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Users } from "lucide-react";
import { Card } from "@/components/game/Card";
import { supabase } from "@/lib/supabase/client";
import {
  subscribeToGameState,
  unsubscribeFromGameState,
  type SerializableGameState,
} from "@/lib/multiplayer/sync";
import { Suit } from "@/lib/game/types/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const SUIT_SYMBOLS: Record<string, string> = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
};

const SUIT_COLORS: Record<string, string> = {
  spades: "text-slate-300",
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-slate-300",
};

const SUIT_NAMES: Record<string, "hearts" | "diamonds" | "clubs" | "spades"> = {
  [Suit.HEARTS]: "hearts",
  [Suit.DIAMONDS]: "diamonds",
  [Suit.CLUBS]: "clubs",
  [Suit.SPADES]: "spades",
};

const SUITS_ORDER = [Suit.SPADES, Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS];

function getSuitDisplayName(suit: string): string {
  return suit.charAt(0).toUpperCase() + suit.slice(1);
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SpectatePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [gameState, setGameState] = useState<SerializableGameState | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Check if game exists and is playing
        const { data: game, error: gameError } = await (
          supabase.from("games") as any
        )
          .select("status")
          .eq("id", gameId)
          .maybeSingle();

        if (gameError || !game) {
          setError("Game not found.");
          setLoading(false);
          return;
        }

        if (game.status === "cancelled") {
          setError("This game has been cancelled.");
          setLoading(false);
          return;
        }

        if (game.status === "waiting") {
          setError("This game hasn't started yet.");
          setLoading(false);
          return;
        }

        // Load initial state
        const { data: stateRow, error: stateError } = await (
          supabase.from("game_state") as any
        )
          .select("state")
          .eq("game_id", gameId)
          .single();

        if (stateError || !stateRow) {
          setError("Could not load game state.");
          setLoading(false);
          return;
        }

        setGameState(stateRow.state as SerializableGameState);
        setLoading(false);

        // Subscribe to realtime updates
        const ch = subscribeToGameState(gameId, (newState) => {
          setGameState(newState);
        });
        setChannel(ch);
      } catch {
        setError("Something went wrong.");
        setLoading(false);
      }
    };

    init();

    // Subscribe to game status changes
    const statusChannel = supabase
      .channel(`spectate_status:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new.status === "cancelled") {
            setError("This game has been cancelled.");
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) unsubscribeFromGameState(channel);
      supabase.removeChannel(statusChannel);
    };
  }, [gameId]);

  // ── Loading / Error states ──

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400">Connecting to game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <Eye className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 text-lg mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="border-slate-600 text-slate-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isFinished = gameState.gamePhase === "finished";

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Leave
        </Button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
          <Eye className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Spectating
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
          <Users className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-300">
            {gameState.players.length} Players
          </span>
        </div>
      </div>

      {/* Turn / Status banner */}
      <div
        className={`text-center py-2 text-sm font-semibold ${
          isFinished
            ? "bg-amber-500/20 text-amber-400"
            : "bg-emerald-500/20 text-emerald-400 animate-pulse"
        }`}
      >
        {isFinished
          ? `Game Over — ${gameState.players.find((p) => p.id === gameState.rankings[0])?.name || "Unknown"} wins!`
          : `${currentPlayer?.name}'s turn`}
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-4 gap-4">
        {/* Players */}
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {gameState.players.map((player, index) => {
              const finishPos = gameState.rankings.indexOf(player.id);
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isFinished && finishPos === 0
                      ? "border-amber-500/50 bg-amber-500/10"
                      : index === gameState.currentPlayerIndex && !isFinished
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
                        {isFinished && finishPos >= 0 && (
                          <span className="ml-1.5 text-xs text-amber-400">
                            #{finishPos + 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 ml-9">
                    {player.handSize} cards
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 h-full">
            {SUITS_ORDER.map((suit) => {
              const sequence = gameState.board[suit];
              const isOpen = sequence.low !== null && sequence.high !== null;
              const cardCount = isOpen ? sequence.high! - sequence.low! + 1 : 0;

              const displayCards: number[] = [];
              if (isOpen) {
                for (let r = sequence.low!; r <= sequence.high!; r++) {
                  displayCards.push(r);
                }
              }

              return (
                <div
                  key={suit}
                  className={`rounded-xl p-3 flex flex-col transition-all ${
                    isOpen
                      ? "bg-slate-800/60 border border-slate-700"
                      : "bg-slate-800/30 border border-slate-800 border-dashed"
                  }`}
                >
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

                  <div className="flex-1 flex flex-col items-center justify-center">
                    {!isOpen ? (
                      <div className="text-sm text-slate-600 italic">
                        Play 7{SUIT_SYMBOLS[suit]} to open
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div
                          className="relative flex items-end justify-center"
                          style={{
                            minHeight: `${displayCards.length * 14 + 70}px`,
                            width: "100%",
                          }}
                        >
                          {displayCards.map((rank, idx) => (
                            <div
                              key={`${suit}-${rank}`}
                              className="absolute left-1/2 -translate-x-1/2"
                              style={{
                                bottom: `${idx * 14}px`,
                                zIndex: idx,
                              }}
                            >
                              <Card
                                suit={SUIT_NAMES[suit]}
                                rank={rank}
                                size="small"
                              />
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
    </div>
  );
}
