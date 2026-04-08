"use client";

export const dynamic = 'force-dynamic';

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { joinGame } from "@/lib/actions/lobby-actions";
import { normalizeGameCode, validateGameCode } from "@/lib/multiplayer/gameCode";

function JoinGameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleGameCodeChange = (value: string) => {
    // Auto-format as user types (ABC DEF)
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalized.length <= 6) {
      const formatted = normalized.length > 3
        ? `${normalized.slice(0, 3)} ${normalized.slice(3)}`
        : normalized;
      setGameCode(formatted);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    const normalized = normalizeGameCode(gameCode);
    if (!validateGameCode(normalized)) {
      setError("Please enter a valid 6-character game code");
      return;
    }

    setIsJoining(true);
    setError("");

    const result = await joinGame(normalized, playerName.trim());

    setIsJoining(false);

    if (result.success) {
      // Store player info in sessionStorage
      sessionStorage.setItem("playerId", result.data.playerId);
      sessionStorage.setItem("playerName", playerName.trim());

      // Navigate to lobby
      router.push(`/multiplayer/lobby/${result.data.gameId}`);
    } else {
      setError(result.error || "Failed to join game");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 dark:from-emerald-600/10 dark:to-teal-700/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-400/20 to-cyan-500/20 dark:from-blue-600/10 dark:to-cyan-700/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      {/* Back button */}
      <Link href="/multiplayer/setup" className="absolute top-8 left-8 z-20">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>

      <main className="relative z-10 flex flex-col items-center justify-center px-4 w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8 w-full"
        >
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
              Join Game
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Enter the game code to join your friends
            </p>
          </div>

          {/* Name Input */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <label htmlFor="playerName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
              disabled={isJoining}
            />
          </motion.div>

          {/* Game Code Input */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <label htmlFor="gameCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Game Code
            </label>
            <input
              type="text"
              id="gameCode"
              value={gameCode}
              onChange={(e) => handleGameCodeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isJoining) {
                  handleJoinGame();
                }
              }}
              placeholder="ABC DEF"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-2xl font-mono text-center tracking-wider"
              disabled={isJoining}
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
              Enter the 6-character code from your friend
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            )}
          </motion.div>

          {/* Join Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <Button
              size="lg"
              onClick={handleJoinGame}
              disabled={isJoining || !playerName.trim() || !gameCode.trim()}
              className="w-full text-lg py-6 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Joining Game...
                </>
              ) : (
                "Join Game"
              )}
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default function JoinGamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinGameContent />
    </Suspense>
  );
}
