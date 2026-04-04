"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Zap, Target, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
  const [playMode, setPlayMode] = useState<"single" | "multi">("single");
  const [gameMode, setGameMode] = useState<"easy" | "hard">("easy");
  const router = useRouter();

  const handleStartGame = () => {
    if (playMode === "single") {
      router.push(`/game?mode=${gameMode}`);
    } else {
      // Route to multiplayer options
      router.push(`/multiplayer/setup?mode=${gameMode}`);
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
      <Link href="/" className="absolute top-8 left-8 z-20">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>

      <main className="relative z-10 flex flex-col items-center justify-center px-4 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8 w-full"
        >
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
              Game Setup
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Configure your game settings
            </p>
          </div>

          {/* Play Mode Selection */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Play Mode
              </h2>
            </div>
            <div className="space-y-3">
              {/* Single Player */}
              <button
                onClick={() => setPlayMode("single")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  playMode === "single"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <WifiOff className={`h-5 w-5 ${playMode === "single" ? "text-purple-600" : "text-slate-400"}`} />
                    <div>
                      <h3 className={`font-semibold ${playMode === "single" ? "text-purple-900 dark:text-purple-100" : "text-slate-900 dark:text-white"}`}>
                        Single Player
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Play against AI opponent
                      </p>
                    </div>
                  </div>
                  {playMode === "single" && (
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              {/* Multiplayer */}
              <button
                onClick={() => setPlayMode("multi")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  playMode === "multi"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wifi className={`h-5 w-5 ${playMode === "multi" ? "text-orange-600" : "text-slate-400"}`} />
                    <div>
                      <h3 className={`font-semibold ${playMode === "multi" ? "text-orange-900 dark:text-orange-100" : "text-slate-900 dark:text-white"}`}>
                        Multiplayer
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Play with friends (2-4 players)
                      </p>
                    </div>
                  </div>
                  {playMode === "multi" && (
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </motion.div>

          {/* Game mode selection */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Game Mode
              </h2>
            </div>
            <div className="space-y-3">
              {/* Easy Mode */}
              <button
                onClick={() => setGameMode("easy")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  gameMode === "easy"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className={`h-5 w-5 ${gameMode === "easy" ? "text-emerald-600" : "text-slate-400"}`} />
                    <div>
                      <h3 className={`font-semibold ${gameMode === "easy" ? "text-emerald-900 dark:text-emerald-100" : "text-slate-900 dark:text-white"}`}>
                        Easy Mode
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Valid cards are highlighted
                      </p>
                    </div>
                  </div>
                  {gameMode === "easy" && (
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              {/* Hard Mode */}
              <button
                onClick={() => setGameMode("hard")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  gameMode === "hard"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className={`h-5 w-5 ${gameMode === "hard" ? "text-blue-600" : "text-slate-400"}`} />
                    <div>
                      <h3 className={`font-semibold ${gameMode === "hard" ? "text-blue-900 dark:text-blue-100" : "text-slate-900 dark:text-white"}`}>
                        Hard Mode
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Strategic passing allowed
                      </p>
                    </div>
                  </div>
                  {gameMode === "hard" && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </motion.div>

          {/* Start button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <Button
              size="lg"
              onClick={handleStartGame}
              className="w-full text-lg py-6 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {playMode === "single" ? "Start Game" : "Continue to Multiplayer"}
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
