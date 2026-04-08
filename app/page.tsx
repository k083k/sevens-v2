"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Play, Zap, Trophy } from "lucide-react";

// Playing card component with enhanced design
const PlayingCard = ({ suit, rank, delay = 0, position }: { suit: string; rank: string; delay?: number; position: { top?: string; bottom?: string; left?: string; right?: string } }) => {
  const suitInfo: Record<string, { color: string; symbol: string }> = {
    "hearts": { color: "text-red-500", symbol: "♥" },
    "diamonds": { color: "text-red-500", symbol: "♦" },
    "spades": { color: "text-slate-300", symbol: "♠" },
    "clubs": { color: "text-slate-300", symbol: "♣" },
  };

  const { color, symbol } = suitInfo[suit];

  return (
    <motion.div
      className="absolute"
      style={position}
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{
        opacity: [0.5, 0.8, 0.5],
        y: [0, -25, 0],
        rotate: [-8, 8, -8],
        scale: [0.95, 1.05, 0.95],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      <div className="relative w-24 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden" style={{
        boxShadow: "0 10px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
      }}>
        {/* Card shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-60" />

        {/* Top left corner */}
        <div className="absolute top-2 left-2 flex flex-col items-center leading-none">
          <span className={`text-xl font-bold ${color}`}>{rank}</span>
          <span className={`text-2xl ${color} -mt-1`}>{symbol}</span>
        </div>

        {/* Center suit */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-6xl ${color} opacity-90`}>{symbol}</span>
        </div>

        {/* Bottom right corner (rotated) */}
        <div className="absolute bottom-2 right-2 flex flex-col items-center leading-none rotate-180">
          <span className={`text-xl font-bold ${color}`}>{rank}</span>
          <span className={`text-2xl ${color} -mt-1`}>{symbol}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-600/10 to-teal-700/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/10 to-cyan-700/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      {/* Floating playing cards in background - only render after mount */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <PlayingCard suit="hearts" rank="7" delay={0} position={{ top: "10%", left: "8%" }} />
          <PlayingCard suit="spades" rank="7" delay={0.5} position={{ top: "15%", right: "12%" }} />
          <PlayingCard suit="diamonds" rank="A" delay={1} position={{ top: "60%", left: "5%" }} />
          <PlayingCard suit="clubs" rank="K" delay={1.5} position={{ top: "70%", right: "8%" }} />
          <PlayingCard suit="hearts" rank="Q" delay={2} position={{ bottom: "15%", left: "15%" }} />
          <PlayingCard suit="spades" rank="J" delay={2.5} position={{ bottom: "20%", right: "18%" }} />
          <PlayingCard suit="diamonds" rank="7" delay={0.8} position={{ top: "35%", right: "5%" }} />
          <PlayingCard suit="clubs" rank="7" delay={1.8} position={{ bottom: "40%", left: "10%" }} />
        </div>
      )}

      <main className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={mounted ? { opacity: 0, y: 20 } : false}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-10"
        >
          {/* Icon */}
          <motion.div
            initial={mounted ? { scale: 0, rotate: -180 } : false}
            animate={mounted ? { scale: 1, rotate: 0 } : {}}
            transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 12 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl blur-2xl opacity-40 animate-pulse" />
            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 rounded-3xl shadow-2xl">
              <div className="text-6xl">7</div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={mounted ? { opacity: 0 } : false}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="space-y-6"
          >
            <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              SEVENS
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 font-bold tracking-wide">
              The Classic Card Game
            </p>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={mounted ? { opacity: 0 } : false}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="max-w-lg text-xl text-slate-400 leading-relaxed"
          >
            Master the art of sequence building. Play your cards strategically, starting from sevens, and outmaneuver your opponent.
          </motion.p>

          {/* Play Button */}
          <motion.div
            initial={mounted ? { opacity: 0, scale: 0.9 } : false}
            animate={mounted ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileHover={mounted ? { scale: 1.05 } : {}}
            whileTap={mounted ? { scale: 0.95 } : {}}
            className="mt-4"
          >
            <Link href="/setup">
              <Button
                size="lg"
                className="text-xl px-12 py-8 shadow-2xl hover:shadow-emerald-500/50 dark:hover:shadow-emerald-500/20 transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0"
              >
                <Play className="mr-3 h-6 w-6 fill-current" />
                Start Playing
              </Button>
            </Link>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            initial={mounted ? { opacity: 0 } : false}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-8 flex flex-wrap gap-4 justify-center text-sm"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="font-medium text-slate-300">Competitive AI</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-slate-300">Easy & Hard Modes</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-slate-300">Ready to Play</span>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
