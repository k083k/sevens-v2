"use client";

export const dynamic = 'force-dynamic';

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { createGame } from "@/lib/actions/lobby-actions";

function CreateGameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") as "easy" | "hard" || "easy";

  const [playerName, setPlayerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsCreating(true);
    setError("");

    const result = await createGame(playerName.trim(), mode, 4);

    setIsCreating(false);

    if (result.success) {
      // Store player info in sessionStorage
      sessionStorage.setItem("playerId", result.data.playerId);
      sessionStorage.setItem("playerName", playerName.trim());

      // Navigate to lobby
      router.push(`/multiplayer/lobby/${result.data.gameId}`);
    } else {
      setError(result.error || "Failed to create game");
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
              Create Game
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Enter your name to create a new game
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreateGame();
                }
              }}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-lg"
              disabled={isCreating}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </motion.div>

          {/* Game Info */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Game Settings
            </h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {mode === "easy" ? "Easy" : "Hard"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Max Players:</span>
                <span className="font-medium text-slate-900 dark:text-white">4</span>
              </div>
              <div className="flex justify-between">
                <span>Your Role:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Host</span>
              </div>
            </div>
          </motion.div>

          {/* Create Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <Button
              size="lg"
              onClick={handleCreateGame}
              disabled={isCreating || !playerName.trim()}
              className="w-full text-lg py-6 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Game...
                </>
              ) : (
                "Create Game"
              )}
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default function CreateGamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateGameContent />
    </Suspense>
  );
}
