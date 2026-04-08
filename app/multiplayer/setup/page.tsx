"use client";

export const dynamic = 'force-dynamic';

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, PlusCircle, Users } from "lucide-react";
import Link from "next/link";

function MultiplayerSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") as "easy" | "hard" || "easy";

  const handleCreateGame = () => {
    router.push(`/multiplayer/create?mode=${mode}`);
  };

  const handleJoinGame = () => {
    router.push(`/multiplayer/join?mode=${mode}`);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-600/10 to-teal-700/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 to-cyan-700/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      {/* Back button */}
      <Link href="/setup" className="absolute top-8 left-8 z-20">
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
              Multiplayer Setup
            </h1>
            <p className="text-lg text-slate-400">
              Create a new game or join an existing one
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700">
              <span className="text-sm font-medium text-slate-300">
                Mode: {mode === "easy" ? "Easy" : "Hard"}
              </span>
            </div>
          </div>

          {/* Create Game Option */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <button
              onClick={handleCreateGame}
              className="w-full text-left p-6 rounded-2xl border-2 border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:border-emerald-500 hover:bg-emerald-950/30 transition-all shadow-lg hover:shadow-xl group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                  <PlusCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Create New Game
                  </h3>
                  <p className="text-sm text-slate-400">
                    Host a game and get a code to share with friends
                  </p>
                </div>
                <div className="text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </motion.div>

          {/* Join Game Option */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <button
              onClick={handleJoinGame}
              className="w-full text-left p-6 rounded-2xl border-2 border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:border-blue-500 hover:bg-blue-950/30 transition-all shadow-lg hover:shadow-xl group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Join Existing Game
                  </h3>
                  <p className="text-sm text-slate-400">
                    Enter a game code to join your friends
                  </p>
                </div>
                <div className="text-slate-400 group-hover:text-blue-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default function MultiplayerSetupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" /><p className="text-slate-400">Loading...</p></div></div>}>
      <MultiplayerSetupContent />
    </Suspense>
  );
}
