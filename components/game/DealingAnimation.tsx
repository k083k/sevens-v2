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

/** Positions around the table where player hands sit (relative to center) */
const PLAYER_POSITIONS: Record<number, Array<{ x: number; y: number; label: string }>> = {
  2: [
    { x: 0, y: 140, label: "bottom" },   // You (bottom)
    { x: 0, y: -140, label: "top" },      // Opponent (top)
  ],
  3: [
    { x: 0, y: 140, label: "bottom" },
    { x: -180, y: -60, label: "left" },
    { x: 180, y: -60, label: "right" },
  ],
  4: [
    { x: 0, y: 140, label: "bottom" },
    { x: -180, y: 0, label: "left" },
    { x: 0, y: -140, label: "top" },
    { x: 180, y: 0, label: "right" },
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

    // Create cards for shuffle visual
    setShuffleCards(Array.from({ length: 12 }, (_, i) => i));
    soundManager.play("shuffle");

    const timer = setTimeout(() => {
      setPhase("deal");
    }, 900);

    return () => clearTimeout(timer);
  }, [phase]);

  // Deal phase
  const cardIdCounter = useRef(0);
  useEffect(() => {
    if (phase !== "deal") return;

    soundManager.play("gameStart");

    // Deal cards in round-robin, with staggered timing
    const totalCards = Math.min(cardsPerPlayer * playerCount, 16); // Show max 16 for perf
    let dealt = 0;
    let cancelled = false;

    const dealNext = () => {
      if (cancelled) return;
      if (dealt >= totalCards) {
        // Brief pause then complete
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

    // Small delay before dealing starts
    const timer = setTimeout(dealNext, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [phase, playerCount, cardsPerPlayer, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative w-[500px] h-[400px]">
        {/* Center deck */}
        <AnimatePresence>
          {phase === "shuffle" && (
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              exit={{ scale: 0.95, opacity: 0.8 }}
            >
              {/* Deck stack */}
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
                  transition={{
                    duration: 0.3,
                    delay: (i * 0.04),
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-16 h-24 rounded-lg overflow-hidden shadow-lg border border-slate-600/50">
                    <Image
                      src="/cards/back-blue.png"
                      alt="Card back"
                      width={64}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deck during deal phase (stays in center, shrinks) */}
        {phase === "deal" && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute"
                style={{ y: -i * 2, zIndex: i }}
              >
                <div className="w-16 h-24 rounded-lg overflow-hidden shadow-lg border border-slate-600/50">
                  <Image
                    src="/cards/back-blue.png"
                    alt="Card back"
                    width={64}
                    height={96}
                    className="w-full h-full object-cover"
                  />
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
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            }}
          >
            <div className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-800/60 rounded-md border border-slate-700/50">
              {playerNames[idx] || `Player ${idx + 1}`}
            </div>
          </div>
        ))}

        {/* Dealt cards flying from center to players */}
        {dealtCards.map((card) => {
          const target = positions[card.playerIdx];
          return (
            <motion.div
              key={card.id}
              className="absolute left-1/2 top-1/2 z-20"
              initial={{
                x: -32,
                y: -48,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: target.x - 32 + (Math.random() * 20 - 10),
                y: target.y - 48 + (Math.random() * 10 - 5),
                scale: 0.6,
                opacity: 0.8,
              }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
            >
              <div className="w-16 h-24 rounded-lg overflow-hidden shadow-lg border border-slate-600/50">
                <Image
                  src="/cards/back-blue.png"
                  alt="Card"
                  width={64}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          );
        })}

        {/* Phase label */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm text-slate-500 font-medium"
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
