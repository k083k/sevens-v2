"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, Users as UsersIcon, Crown, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getGamePlayers, leaveGame, startGame } from "@/lib/actions/lobby-actions";
import { formatGameCode } from "@/lib/multiplayer/gameCode";

interface Player {
  id: string;
  player_id: string;
  player_name: string;
  seat_position: number;
  is_host: boolean;
  connected: boolean;
}

interface Game {
  id: string;
  code: string;
  status: string;
  mode: string;
  max_players: number;
}

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string>("");
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch game and player data
  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem("playerId");
    if (!storedPlayerId) {
      router.push("/multiplayer/setup");
      return;
    }
    setPlayerId(storedPlayerId);

    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      // Fetch game
      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameData) {
        setGame(gameData as Game);
      }

      // Fetch players
      const playersList = await getGamePlayers(gameId);
      setPlayers(playersList as Player[]);

      // Check if current user is host
      const currentPlayer = playersList.find((p: Player) => p.player_id === sessionStorage.getItem("playerId"));
      if (currentPlayer) {
        setIsHost(Boolean((currentPlayer as any).is_host));
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching game data:", error);
      setLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!gameId) return;

    // Subscribe to game updates
    const gameChannel = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const updatedGame = payload.new as Game;
          setGame(updatedGame);

          // If game started, navigate to multiplayer game page
          if (updatedGame.status === "playing") {
            router.push(`/multiplayer/game/${gameId}?mode=${updatedGame.mode}`);
          }
        }
      )
      .subscribe();

    // Subscribe to player updates
    const playersChannel = supabase
      .channel(`players:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchGameData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(playersChannel);
    };
  }, [gameId, router]);

  const handleCopyCode = () => {
    if (game) {
      navigator.clipboard.writeText(game.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = async () => {
    if (playerId) {
      const result = await leaveGame(gameId, playerId);
      router.push("/");
    }
  };

  const handleStartGame = async () => {
    if (!isHost || players.length < 2) return;

    setIsStarting(true);
    const result = await startGame(gameId, playerId);

    if (!result.success) {
      alert('error' in result ? result.error : 'Failed to start game');
      setIsStarting(false);
    }
    // If successful, the realtime subscription will navigate us
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading lobby...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">Game not found</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 dark:from-emerald-600/10 dark:to-teal-700/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-400/20 to-cyan-500/20 dark:from-blue-600/10 dark:to-cyan-700/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      {/* Back button */}
      <div className="absolute top-8 left-8 z-20">
        <Button variant="ghost" size="sm" onClick={handleLeave}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Leave
        </Button>
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center px-4 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8 w-full"
        >
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
              Game Lobby
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Waiting for players to join...
            </p>
          </div>

          {/* Game Code Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Share this code with your friends:
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-5xl font-bold font-mono tracking-wider text-emerald-600 dark:text-emerald-400">
                  {formatGameCode(game.code)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                >
                  {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Players List */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Players ({players.length}/{game.max_players})
              </h2>
            </div>
            <div className="space-y-2">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                      {player.player_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {player.player_name}
                      {player.player_id === playerId && " (You)"}
                    </span>
                  </div>
                  {player.is_host && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium">
                      <Crown className="h-4 w-4" />
                      Host
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Game Info */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Game Mode:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {game.mode === "easy" ? "Easy" : "Hard"}
              </span>
            </div>
          </motion.div>

          {/* Start Game Button (Host Only) */}
          {isHost && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full"
            >
              <Button
                size="lg"
                onClick={handleStartGame}
                disabled={players.length < 2 || isStarting}
                className="w-full text-lg py-6 shadow-xl hover:shadow-2xl transition-all duration-300 bg-teal-600 hover:bg-teal-700"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting Game...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Start Game {players.length < 2 && "(Need 2+ players)"}
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Waiting message for non-hosts */}
          {!isHost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-slate-600 dark:text-slate-400"
            >
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Waiting for host to start the game...</p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
