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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-600/10 to-teal-700/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 to-cyan-700/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
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
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-200 to-white bg-clip-text text-transparent">
              Game Setup
            </h1>
            <p className="text-lg text-slate-400">
              Configure your game settings
            </p>
          </div>

          {/* Play Mode Selection */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Play Mode
              </h2>
            </div>
            <div className="space-y-3" role="radiogroup" aria-label="Play mode">
              {/* Single Player */}
              <button
                role="radio"
                aria-checked={playMode === "single"}
                onClick={() => setPlayMode("single")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  playMode === "single"
                    ? "border-purple-500 bg-purple-950/30"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <WifiOff className={`h-5 w-5 ${playMode === "single" ? "text-purple-400" : "text-slate-400"}`} />
                    <div>
                      <h3 className={`font-semibold ${playMode === "single" ? "text-purple-100" : "text-white"}`}>
                        Single Player
                      </h3>
                      <p className="text-sm text-slate-400">
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
                role="radio"
                aria-checked={playMode === "multi"}
                onClick={() => setPlayMode("multi")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  playMode === "multi"
                    ? "border-orange-500 bg-orange-950/30"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wifi className={`h-5 w-5 ${playMode === "multi" ? "text-orange-400" : "text-slate-400"}`} />
                    <div>
                      <h3 className={`font-semibold ${playMode === "multi" ? "text-orange-100" : "text-white"}`}>
                        Multiplayer
                      </h3>
                      <p className="text-sm text-slate-400">
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
            className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Game Mode
              </h2>
            </div>
            <div className="space-y-3" role="radiogroup" aria-label="Game difficulty">
              {/* Easy Mode */}
              <button
                role="radio"
                aria-checked={gameMode === "easy"}
                onClick={() => setGameMode("easy")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  gameMode === "easy"
                    ? "border-emerald-500 bg-emerald-950/30"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className={`h-5 w-5 ${gameMode === "easy" ? "text-emerald-400" : "text-slate-400"}`} />
                    <div>
                      <h3 className={`font-semibold ${gameMode === "easy" ? "text-emerald-100" : "text-white"}`}>
                        Easy Mode
                      </h3>
                      <p className="text-sm text-slate-400">
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
                role="radio"
                aria-checked={gameMode === "hard"}
                onClick={() => setGameMode("hard")}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  gameMode === "hard"
                    ? "border-blue-500 bg-blue-950/30"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className={`h-5 w-5 ${gameMode === "hard" ? "text-blue-400" : "text-slate-400"}`} />
                    <div>
                      <h3 className={`font-semibold ${gameMode === "hard" ? "text-blue-100" : "text-white"}`}>
                        Hard Mode
                      </h3>
                      <p className="text-sm text-slate-400">
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
