"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { soundManager } from "@/lib/sounds/SoundManager";

interface DealingAnimationProps {
  playerCount: number;
  playerNames: string[];
  onComplete: () => void;
}

/**
 * Positions as fractions of container size so they scale on any screen.
 * x/y are percentage offsets from center.
 */
const PLAYER_POSITIONS: Record<number, Array<{ xPct: number; yPct: number }>> = {
  2: [
    { xPct: 0, yPct: 35 },   // You (bottom)
    { xPct: 0, yPct: -35 },  // Opponent (top)
  ],
  3: [
    { xPct: 0, yPct: 35 },
    { xPct: -38, yPct: -15 },
    { xPct: 38, yPct: -15 },
  ],
  4: [
    { xPct: 0, yPct: 35 },
    { xPct: -38, yPct: 0 },
    { xPct: 0, yPct: -35 },
    { xPct: 38, yPct: 0 },
  ],
};

export function DealingAnimation({
  playerCount,
  playerNames,
  onComplete,
}: DealingAnimationProps) {
  const [phase, setPhase] = useState<"shuffle" | "deal" | "done">("shuffle");
  const [dealtCards, setDealtCards] = useState<Array<{ id: number; playerIdx: number }>>([]);
  const [shuffleCards, setShuffleCards] = useState<number[]>([]);

  const positions = PLAYER_POSITIONS[playerCount] || PLAYER_POSITIONS[2];
  const cardsPerPlayer = Math.floor(52 / playerCount);

  // Shuffle phase
  useEffect(() => {
    if (phase !== "shuffle") return;
    setShuffleCards(Array.from({ length: 12 }, (_, i) => i));
    soundManager.play("shuffle");

    const timer = setTimeout(() => setPhase("deal"), 900);
    return () => clearTimeout(timer);
  }, [phase]);

  // Deal phase
  const cardIdCounter = useRef(0);
  useEffect(() => {
    if (phase !== "deal") return;

    soundManager.play("gameStart");

    const totalCards = Math.min(cardsPerPlayer * playerCount, 16);
    let dealt = 0;
    let cancelled = false;

    const dealNext = () => {
      if (cancelled) return;
      if (dealt >= totalCards) {
        setTimeout(onComplete, 400);
        return;
      }

      const playerIdx = dealt % playerCount;
      const id = cardIdCounter.current++;
      setDealtCards((prev) => [...prev, { id, playerIdx }]);
      soundManager.play("deal");
      dealt++;

      setTimeout(dealNext, 80);
    };

    const timer = setTimeout(dealNext, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [phase, playerCount, cardsPerPlayer, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Container scales with viewport, max 500x400 on desktop */}
      <div className="relative w-full max-w-[500px] aspect-[5/4]">
        {/* Center deck */}
        <AnimatePresence>
          {phase === "shuffle" && (
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              exit={{ scale: 0.95, opacity: 0.8 }}
            >
              {shuffleCards.map((i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ zIndex: i }}
                  initial={{ x: 0, y: -i * 2, rotate: 0 }}
                  animate={{
                    x: [0, (i % 2 === 0 ? 30 : -30), 0],
                    y: [-i * 2, -i * 2 + (i % 2 === 0 ? -8 : 8), -i * 2],
                    rotate: [0, (i % 2 === 0 ? 5 : -5), 0],
                  }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease: "easeInOut" }}
                >
                  <div className="w-12 h-[72px] sm:w-16 sm:h-24 rounded-lg overflow-hidden shadow-lg border border-slate-600/50">
                    <Image src="/cards/back-blue.png" alt="Card back" width={64} height={96} className="w-full h-full object-cover" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deck during deal phase */}
        {phase === "deal" && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="absolute" style={{ top: -i * 2, zIndex: i }}>
                <div className="w-12 h-[72px] sm:w-16 sm:h-24 rounded-lg overflow-hidden shadow-lg border border-slate-600/50">
                  <Image src="/cards/back-blue.png" alt="Card back" width={64} height={96} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Player positions / labels */}
        {positions.map((pos, idx) => (
          <div
            key={idx}
            className="absolute left-1/2 top-1/2 flex flex-col items-center gap-1"
            style={{
              transform: `translate(calc(-50% + ${pos.xPct}cqw), calc(-50% + ${pos.yPct}cqh))`,
            }}
          >
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium px-2 py-1 bg-slate-800/60 rounded-md border border-slate-700/50 whitespace-nowrap">
              {playerNames[idx] || `Player ${idx + 1}`}
            </div>
          </div>
        ))}

        {/* Dealt cards flying from center to players */}
        {dealtCards.map((card) => {
          const target = positions[card.playerIdx];
          // Convert percentage to pixels based on a rough estimate.
          // Using vw-relative values for the animation targets.
          return (
            <motion.div
              key={card.id}
              className="absolute left-1/2 top-1/2 z-20"
              initial={{ x: -24, y: -36, scale: 1, opacity: 1 }}
              animate={{
                x: `calc(${target.xPct}cqw - 24px + ${(Math.random() * 16 - 8)}px)`,
                y: `calc(${target.yPct}cqh - 36px + ${(Math.random() * 8 - 4)}px)`,
                scale: 0.6,
                opacity: 0.8,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="w-12 h-[72px] sm:w-16 sm:h-24 rounded-lg overflow-hidden shadow-lg border border-slate-600/50">
                <Image src="/cards/back-blue.png" alt="Card" width={64} height={96} className="w-full h-full object-cover" />
              </div>
            </motion.div>
          );
        })}

        {/* Phase label */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs sm:text-sm text-slate-500 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {phase === "shuffle" ? "Shuffling..." : "Dealing cards..."}
        </motion.div>
      </div>
    </div>
  );
}
