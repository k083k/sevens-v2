"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Target,
  Flame,
  BarChart3,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { getStats, resetStats, getWinRate, type GameStats } from "@/lib/stats/gameStats";

function StatCard({
  label,
  value,
  icon,
  color = "text-white",
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3"
    >
      <div className="p-2 bg-slate-700/30 rounded-lg text-slate-400">
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </motion.div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setStats(getStats());
  }, []);

  const handleReset = () => {
    resetStats();
    setStats(getStats());
    setShowConfirm(false);
  };

  if (!stats) return null;

  const winRate = getWinRate(stats);
  const streakIcon =
    stats.currentStreak > 0 ? (
      <TrendingUp className="h-4 w-4 text-emerald-400" />
    ) : stats.currentStreak < 0 ? (
      <TrendingDown className="h-4 w-4 text-red-400" />
    ) : (
      <Minus className="h-4 w-4 text-slate-400" />
    );

  const streakText =
    stats.currentStreak > 0
      ? `${stats.currentStreak} win${stats.currentStreak > 1 ? "s" : ""}`
      : stats.currentStreak < 0
      ? `${Math.abs(stats.currentStreak)} loss${Math.abs(stats.currentStreak) > 1 ? "es" : ""}`
      : "None";

  const streakColor =
    stats.currentStreak > 0
      ? "text-emerald-400"
      : stats.currentStreak < 0
      ? "text-red-400"
      : "text-slate-400";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-600/5 to-teal-700/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/5 to-cyan-700/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-slate-800/50">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-white">Your Stats</h1>
        <div className="w-16" />
      </div>

      <main className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
        {stats.totalGames === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-300 mb-2">No games played yet</h2>
            <p className="text-slate-500 mb-6">Play a game to start tracking your stats!</p>
            <Link href="/setup">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                Play Now
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Total Games"
                value={stats.totalGames}
                icon={<BarChart3 className="h-5 w-5" />}
                delay={0}
              />
              <StatCard
                label="Win Rate"
                value={`${winRate}%`}
                icon={<Target className="h-5 w-5" />}
                color={winRate >= 50 ? "text-emerald-400" : "text-red-400"}
                delay={0.05}
              />
              <StatCard
                label="Wins"
                value={stats.wins}
                icon={<Trophy className="h-5 w-5" />}
                color="text-emerald-400"
                delay={0.1}
              />
              <StatCard
                label="Best Streak"
                value={stats.bestWinStreak}
                icon={<Flame className="h-5 w-5" />}
                color="text-amber-400"
                delay={0.15}
              />
            </div>

            {/* Current streak */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5"
            >
              <h3 className="text-sm font-semibold text-slate-400 mb-3">
                Current Streak
              </h3>
              <div className="flex items-center gap-3">
                {streakIcon}
                <span className={`text-xl font-bold ${streakColor}`}>
                  {streakText}
                </span>
              </div>
            </motion.div>

            {/* Mode breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5"
            >
              <h3 className="text-sm font-semibold text-slate-400 mb-4">
                By Mode
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                  <p className="text-emerald-400 text-xs font-semibold mb-2">EASY</p>
                  <p className="text-white font-bold text-lg">
                    {stats.easyWins}/{stats.easyGames}
                  </p>
                  <p className="text-xs text-slate-500">
                    {stats.easyGames > 0
                      ? `${Math.round((stats.easyWins / stats.easyGames) * 100)}% win rate`
                      : "No games"}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                  <p className="text-blue-400 text-xs font-semibold mb-2">HARD</p>
                  <p className="text-white font-bold text-lg">
                    {stats.hardWins}/{stats.hardGames}
                  </p>
                  <p className="text-xs text-slate-500">
                    {stats.hardGames > 0
                      ? `${Math.round((stats.hardWins / stats.hardGames) * 100)}% win rate`
                      : "No games"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Recent games */}
            {stats.recentGames.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5"
              >
                <h3 className="text-sm font-semibold text-slate-400 mb-4">
                  Recent Games
                </h3>
                <div className="space-y-2">
                  {stats.recentGames.map((game, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            game.won ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                        <span className="text-sm text-slate-300">
                          {game.won ? "Won" : "Lost"}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            game.mode === "easy"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {game.mode}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600">
                        {new Date(game.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reset */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-4 border-t border-slate-800/50"
            >
              {showConfirm ? (
                <div className="flex items-center gap-3 justify-center">
                  <span className="text-sm text-slate-400">Reset all stats?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleReset}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                  >
                    Yes, reset
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-2 text-xs text-slate-600 hover:text-red-400 transition-colors mx-auto"
                >
                  <Trash2 className="h-3 w-3" />
                  Reset Stats
                </button>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
