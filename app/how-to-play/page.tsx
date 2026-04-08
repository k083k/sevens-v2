"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/game/Card";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Spade,
  Heart,
  Diamond,
  Club,
  Lock,
  Unlock,
  ArrowDown,
  ArrowUp,
  HandMetal,
  Trophy,
  RotateCcw,
  Lightbulb,
  Play,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type SuitName = "spades" | "hearts" | "diamonds" | "clubs";

interface SuitSequence {
  low: number | null;
  high: number | null;
}

type BoardState = Record<SuitName, SuitSequence>;

interface HandCard {
  suit: SuitName;
  rank: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SUIT_SYMBOLS: Record<SuitName, string> = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
};

const SUIT_COLORS: Record<SuitName, string> = {
  spades: "text-slate-300",
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-slate-300",
};

const SUIT_ICONS: Record<SuitName, React.ReactNode> = {
  spades: <Spade className="h-4 w-4" />,
  hearts: <Heart className="h-4 w-4" />,
  diamonds: <Diamond className="h-4 w-4" />,
  clubs: <Club className="h-4 w-4" />,
};

function getRankName(rank: number): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return rank.toString();
}

function getRankNameFull(rank: number): string {
  if (rank === 1) return "Ace";
  if (rank === 11) return "Jack";
  if (rank === 12) return "Queen";
  if (rank === 13) return "King";
  return rank.toString();
}

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
  id,
  title,
  subtitle,
  icon,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            {icon}
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {title}
            </h2>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </motion.section>
  );
}

// ─── Mini board display ─────────────────────────────────────────────────────

function MiniBoard({
  board,
  highlightSuit,
  label,
}: {
  board: BoardState;
  highlightSuit?: SuitName;
  label?: string;
}) {
  const suits: SuitName[] = ["spades", "hearts", "diamonds", "clubs"];

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
      {label && (
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
          {label}
        </p>
      )}
      <div className="grid grid-cols-4 gap-2">
        {suits.map((suit) => {
          const seq = board[suit];
          const isOpen = seq.low !== null;
          const isHighlighted = highlightSuit === suit;
          const cards: number[] = [];
          if (isOpen) {
            for (let r = seq.low!; r <= seq.high!; r++) cards.push(r);
          }

          return (
            <div
              key={suit}
              className={`rounded-lg p-2 transition-all ${
                isHighlighted
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : isOpen
                  ? "bg-slate-700/40 border border-slate-600/50"
                  : "bg-slate-800/40 border border-slate-700/30 border-dashed"
              }`}
            >
              <div className="flex items-center gap-1 mb-2">
                <span className={`text-lg ${SUIT_COLORS[suit]}`}>
                  {SUIT_SYMBOLS[suit]}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">
                  {suit}
                </span>
              </div>
              {isOpen ? (
                <div className="flex flex-wrap gap-1">
                  {cards.map((r) => (
                    <span
                      key={r}
                      className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                        SUIT_COLORS[suit]
                      } bg-slate-700/60`}
                    >
                      {getRankName(r)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-600 italic">
                  Play 7{SUIT_SYMBOLS[suit]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Interactive sandbox ────────────────────────────────────────────────────

function PlayableSandbox() {
  const initialBoard: BoardState = {
    spades: { low: null, high: null },
    hearts: { low: null, high: null },
    diamonds: { low: null, high: null },
    clubs: { low: null, high: null },
  };

  const initialHand: HandCard[] = [
    { suit: "spades", rank: 7 },
    { suit: "spades", rank: 6 },
    { suit: "spades", rank: 8 },
    { suit: "hearts", rank: 7 },
    { suit: "hearts", rank: 8 },
    { suit: "diamonds", rank: 7 },
    { suit: "diamonds", rank: 6 },
    { suit: "clubs", rank: 7 },
    { suit: "clubs", rank: 8 },
    { suit: "spades", rank: 5 },
    { suit: "hearts", rank: 6 },
    { suit: "clubs", rank: 9 },
    { suit: "diamonds", rank: 8 },
  ];

  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [hand, setHand] = useState<HandCard[]>(initialHand);
  const [message, setMessage] = useState<{
    text: string;
    type: "info" | "success" | "warning";
  } | null>(null);
  const [movesPlayed, setMovesPlayed] = useState(0);

  const isRankOnSpades = useCallback(
    (rank: number): boolean => {
      const seq = board.spades;
      if (!seq.low) return rank === 7;
      return rank >= seq.low && rank <= seq.high!;
    },
    [board.spades]
  );

  const canPlay = useCallback(
    (card: HandCard): boolean => {
      const seq = board[card.suit];
      const isBoardEmpty = !board.spades.low && !board.hearts.low && !board.diamonds.low && !board.clubs.low;

      if (isBoardEmpty) return card.suit === "spades" && card.rank === 7;

      if (card.rank === 7) return !seq.low;

      if (!seq.low) return false;

      const isAdjacent =
        card.rank === seq.low - 1 || card.rank === seq.high! + 1;
      if (!isAdjacent) return false;

      if (card.suit !== "spades" && !isRankOnSpades(card.rank)) return false;

      return true;
    },
    [board, isRankOnSpades]
  );

  const validCards = useMemo(
    () => hand.filter((c) => canPlay(c)),
    [hand, canPlay]
  );

  const playCard = (card: HandCard) => {
    if (!canPlay(card)) {
      // Give helpful error
      const seq = board[card.suit];
      const isBoardEmpty = !board.spades.low && !board.hearts.low && !board.diamonds.low && !board.clubs.low;

      if (isBoardEmpty && !(card.suit === "spades" && card.rank === 7)) {
        setMessage({
          text: "The first card must be 7\u2660. That's always how the game starts!",
          type: "warning",
        });
      } else if (
        card.suit !== "spades" &&
        !isRankOnSpades(card.rank)
      ) {
        setMessage({
          text: `${getRankNameFull(card.rank)} isn't on the Spades row yet. Play ${getRankNameFull(card.rank)}\u2660 first to unlock it!`,
          type: "warning",
        });
      } else if (card.rank === 7 && seq.low) {
        setMessage({
          text: `${card.suit.charAt(0).toUpperCase() + card.suit.slice(1)} is already open!`,
          type: "warning",
        });
      } else if (!seq.low && card.rank !== 7) {
        setMessage({
          text: `Play 7${SUIT_SYMBOLS[card.suit]} first to open ${card.suit}!`,
          type: "warning",
        });
      } else {
        setMessage({
          text: `That card doesn't fit the sequence yet. Cards must be adjacent (one above or below the current run).`,
          type: "warning",
        });
      }
      return;
    }

    // Play the card
    const newBoard = { ...board };
    const seq = newBoard[card.suit];
    if (card.rank === 7) {
      newBoard[card.suit] = { low: 7, high: 7 };
    } else if (card.rank === seq.low! - 1) {
      newBoard[card.suit] = { ...seq, low: card.rank };
    } else {
      newBoard[card.suit] = { ...seq, high: card.rank };
    }

    setBoard(newBoard);
    setHand((prev) =>
      prev.filter((c) => !(c.suit === card.suit && c.rank === card.rank))
    );
    setMovesPlayed((prev) => prev + 1);

    const cardName = `${getRankNameFull(card.rank)}${SUIT_SYMBOLS[card.suit]}`;
    if (card.rank === 7) {
      setMessage({ text: `${cardName} played! ${card.suit.charAt(0).toUpperCase() + card.suit.slice(1)} is now open.`, type: "success" });
    } else {
      setMessage({ text: `${cardName} played!`, type: "success" });
    }
  };

  const reset = () => {
    setBoard(initialBoard);
    setHand(initialHand);
    setMessage(null);
    setMovesPlayed(0);
  };

  // Group hand by suit
  const handBySuit: { suit: SuitName; cards: HandCard[] }[] = [];
  const suitOrder: SuitName[] = ["spades", "hearts", "diamonds", "clubs"];
  for (const s of suitOrder) {
    const cards = hand
      .filter((c) => c.suit === s)
      .sort((a, b) => a.rank - b.rank);
    if (cards.length > 0) handBySuit.push({ suit: s, cards });
  }

  return (
    <div className="space-y-4">
      {/* Board */}
      <MiniBoard board={board} label="The Board" />

      {/* Message */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message.text}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`text-sm px-4 py-2.5 rounded-lg font-medium ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : message.type === "warning"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Moves played: <strong className="text-white">{movesPlayed}</strong>
        </span>
        <span>
          Cards in hand: <strong className="text-white">{hand.length}</strong>
        </span>
      </div>

      {/* Hand */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-400">
            Your Hand{" "}
            <span className="text-xs text-slate-500">
              (tap a card to play it)
            </span>
          </p>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-slate-700/50"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        {hand.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-emerald-400 font-semibold text-lg">
              All cards played!
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Nice work! You cleared your hand.
            </p>
            <button
              onClick={reset}
              className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {handBySuit.map(({ suit, cards }) => (
              <div key={suit}>
                <div className="flex items-center gap-1 mb-1.5">
                  <span className={`text-xs ${SUIT_COLORS[suit]}`}>
                    {SUIT_SYMBOLS[suit]}
                  </span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                    {suit}
                  </span>
                </div>
                <div className="flex gap-1">
                  {cards.map((card) => {
                    const valid = canPlay(card);
                    return (
                      <motion.div
                        key={`${card.suit}-${card.rank}`}
                        layout
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <Card
                          suit={card.suit}
                          rank={card.rank}
                          size="small"
                          isValid={valid}
                          onClick={() => playCard(card)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {validCards.length > 0 && hand.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-amber-400 flex-shrink-0" />
          <span>
            Cards with the{" "}
            <span className="text-emerald-400">green glow</span> are valid
            moves. Try clicking an invalid card to see why it can't be played!
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Spades Lock Demo ───────────────────────────────────────────────────────

function SpadesLockDemo() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      board: {
        spades: { low: 7, high: 7 },
        hearts: { low: 7, high: 7 },
        diamonds: { low: null, high: null },
        clubs: { low: null, high: null },
      } as BoardState,
      title: "Starting Position",
      description:
        "7\u2660 and 7\u2665 have been played. Spades row only has rank 7.",
      highlight: "spades" as SuitName,
      tryCard: { suit: "hearts" as SuitName, rank: 8 },
      tryResult: "locked",
      explanation:
        "You want to play 8\u2665, but rank 8 isn't on the Spades row yet. It's locked!",
    },
    {
      board: {
        spades: { low: 7, high: 8 },
        hearts: { low: 7, high: 7 },
        diamonds: { low: null, high: null },
        clubs: { low: null, high: null },
      } as BoardState,
      title: "Play 8\u2660 First",
      description:
        "Someone plays 8\u2660 on Spades. Now rank 8 exists on the Spades row.",
      highlight: "spades" as SuitName,
      tryCard: { suit: "hearts" as SuitName, rank: 8 },
      tryResult: "unlocked",
      explanation:
        "Now 8\u2665 can be played! Rank 8 is on the Spades row, so it's unlocked for all suits.",
    },
    {
      board: {
        spades: { low: 7, high: 8 },
        hearts: { low: 7, high: 8 },
        diamonds: { low: null, high: null },
        clubs: { low: null, high: null },
      } as BoardState,
      title: "8\u2665 is Played",
      description:
        "8\u2665 is now on the board. But what about 6\u2665?",
      highlight: "hearts" as SuitName,
      tryCard: { suit: "hearts" as SuitName, rank: 6 },
      tryResult: "locked",
      explanation:
        "6\u2665 is locked! Spades only has 7-8. Rank 6 needs to be played on Spades first (6\u2660).",
    },
  ];

  const current = steps[step];

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`h-2 rounded-full transition-all ${
              i === step
                ? "w-8 bg-emerald-500"
                : "w-2 bg-slate-600 hover:bg-slate-500"
            }`}
          />
        ))}
        <span className="text-xs text-slate-500 ml-2">
          Step {step + 1} of {steps.length}
        </span>
      </div>

      {/* Board state */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <MiniBoard
            board={current.board}
            highlightSuit={current.highlight}
            label={current.title}
          />
        </motion.div>
      </AnimatePresence>

      {/* Description */}
      <p className="text-slate-300 text-sm">{current.description}</p>

      {/* The try card */}
      <div
        className={`flex items-center gap-4 p-4 rounded-xl border ${
          current.tryResult === "locked"
            ? "bg-red-500/5 border-red-500/20"
            : "bg-emerald-500/5 border-emerald-500/20"
        }`}
      >
        <Card
          suit={current.tryCard.suit}
          rank={current.tryCard.rank}
          size="small"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {current.tryResult === "locked" ? (
              <Lock className="h-4 w-4 text-red-400" />
            ) : (
              <Unlock className="h-4 w-4 text-emerald-400" />
            )}
            <span
              className={`text-sm font-semibold ${
                current.tryResult === "locked"
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {current.tryResult === "locked" ? "Locked!" : "Unlocked!"}
            </span>
          </div>
          <p className="text-xs text-slate-400">{current.explanation}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Sequence building visual ───────────────────────────────────────────────

function SequenceDemo() {
  const [played, setPlayed] = useState<number[]>([7]);
  const allCards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  const low = Math.min(...played);
  const high = Math.max(...played);

  const canPlayNext = (rank: number): boolean => {
    if (played.includes(rank)) return false;
    return rank === low - 1 || rank === high + 1;
  };

  const playNext = (rank: number) => {
    if (!canPlayNext(rank)) return;
    setPlayed((prev) => [...prev, rank]);
  };

  const resetDemo = () => setPlayed([7]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
        Spades Row
      </p>

      {/* The sequence */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {allCards.map((rank) => {
          const isPlayed = played.includes(rank);
          const isNext = canPlayNext(rank);

          return (
            <motion.div
              key={rank}
              layout
              className="relative"
            >
              {isPlayed ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card suit="spades" rank={rank} size="small" />
                </motion.div>
              ) : (
                <button
                  onClick={() => playNext(rank)}
                  disabled={!isNext}
                  className={`w-[64px] h-[96px] rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${
                    isNext
                      ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer text-emerald-400"
                      : "border-slate-700/50 bg-slate-800/20 cursor-not-allowed text-slate-700"
                  }`}
                >
                  <span className="text-lg font-mono">{getRankName(rank)}</span>
                </button>
              )}

              {/* Arrow indicators */}
              {isNext && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -top-5 left-1/2 -translate-x-1/2 text-emerald-400"
                >
                  <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Range:{" "}
          <span className="text-white font-mono">
            {getRankName(low)} - {getRankName(high)}
          </span>{" "}
          ({played.length}/13 cards)
        </p>
        <button
          onClick={resetDemo}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-slate-700/50"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {played.length === 13 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
        >
          <p className="text-emerald-400 font-semibold">
            Sequence complete! All 13 cards placed.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Table of contents ──────────────────────────────────────────────────────

const sections = [
  { id: "goal", label: "Goal" },
  { id: "sequences", label: "Sequences" },
  { id: "spades-lock", label: "Spades Lock" },
  { id: "cant-play", label: "Can't Play" },
  { id: "winning", label: "Winning" },
  { id: "try-it", label: "Try It!" },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HowToPlayPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-600/5 to-teal-700/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/5 to-cyan-700/5 rounded-full blur-3xl" />
      </div>

      {/* Top navigation */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>

          {/* Section nav (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-800/50 transition-colors"
              >
                {s.label}
              </a>
            ))}
          </nav>

          <Link href="/setup">
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs"
            >
              <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
              Play Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            How to Play
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Learn the rules of Sevens with interactive examples. Play around, click things, and you'll get it in no time.
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 pb-24 space-y-8">
        {/* 1. Goal */}
        <Section
          id="goal"
          title="The Goal"
          subtitle="What you're trying to do"
          icon={<Trophy className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <p className="text-slate-300 leading-relaxed">
              Be the <strong className="text-white">first player to get rid of all your cards</strong>.
              You do this by playing cards onto four shared sequences on the board &mdash; one for each suit.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["spades", "hearts", "diamonds", "clubs"] as SuitName[]).map(
                (suit) => (
                  <div
                    key={suit}
                    className="flex flex-col items-center gap-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30"
                  >
                    <span className={`text-3xl ${SUIT_COLORS[suit]}`}>
                      {SUIT_SYMBOLS[suit]}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">
                      {suit}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span>A</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                      <span className="text-emerald-400 font-bold">7</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                      <span>K</span>
                    </div>
                  </div>
                )
              )}
            </div>

            <p className="text-sm text-slate-400">
              Each suit builds a sequence from <strong className="text-white">Ace to King</strong>,
              always starting with the <strong className="text-emerald-400">7</strong> and
              extending outward in both directions.
            </p>
          </div>
        </Section>

        {/* 2. Building Sequences */}
        <Section
          id="sequences"
          title="Building Sequences"
          subtitle="How cards get played onto the board"
          icon={<ArrowUp className="h-5 w-5" />}
        >
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/20">
                <span className="text-emerald-400 font-bold text-lg mt-0.5">1</span>
                <div>
                  <p className="text-slate-200 font-medium">
                    Every suit starts with its 7
                  </p>
                  <p className="text-sm text-slate-400">
                    The very first card of the game must be the <strong className="text-white">7 of Spades</strong>.
                    After that, players can open other suits by playing their 7s.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/20">
                <span className="text-emerald-400 font-bold text-lg mt-0.5">2</span>
                <div>
                  <p className="text-slate-200 font-medium">
                    Extend up or down from the 7
                  </p>
                  <p className="text-sm text-slate-400">
                    Once a suit is open, you can play the next card above or below the current
                    range. If spades shows 5-8, the next plays must be 4{SUIT_SYMBOLS.spades} or 9{SUIT_SYMBOLS.spades}.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/20">
                <span className="text-emerald-400 font-bold text-lg mt-0.5">3</span>
                <div>
                  <p className="text-slate-200 font-medium">
                    Fill the full run: Ace to King
                  </p>
                  <p className="text-sm text-slate-400">
                    Each suit is complete when all 13 cards (A through K) have been played.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-5">
              <p className="text-sm text-slate-400 mb-3">
                Try it yourself &mdash; click the green slots to build a sequence:
              </p>
              <SequenceDemo />
            </div>
          </div>
        </Section>

        {/* 3. Spades Lock */}
        <Section
          id="spades-lock"
          title="The Spades Lock"
          subtitle="The most important rule to understand"
          icon={<Lock className="h-5 w-5" />}
        >
          <div className="space-y-5">
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <p className="text-amber-300 font-medium text-sm leading-relaxed">
                A card of any rank in Hearts, Diamonds, or Clubs can only be
                played if that same rank already exists on the Spades row.
              </p>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              This means <strong className="text-white">Spades controls the pace</strong> of the whole game.
              If the Spades row only covers 5-9, then only ranks 5 through 9 can be played in the other suits.
              Want to play 10{SUIT_SYMBOLS.hearts}? Someone needs to play 10{SUIT_SYMBOLS.spades} first.
            </p>

            <div className="border-t border-slate-700/50 pt-5">
              <p className="text-sm text-slate-400 mb-3">
                Step through this example to see it in action:
              </p>
              <SpadesLockDemo />
            </div>
          </div>
        </Section>

        {/* 4. Can't Play */}
        <Section
          id="cant-play"
          title="Can't Play?"
          subtitle="What happens when you're stuck"
          icon={<HandMetal className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <p className="text-slate-300 leading-relaxed">
              If you have <strong className="text-white">no valid moves</strong>, you
              must pass your turn. But there's a catch:
            </p>

            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-400 text-sm font-bold">!</span>
                </div>
                <div>
                  <p className="text-slate-200 font-medium">
                    You give a card to the next player
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    When you can't play, you must choose one card from your hand and
                    give it to the next player in turn order. Choose wisely &mdash; giving
                    them a helpful card could cost you the game!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                <p className="text-emerald-400 text-xs font-semibold mb-1">
                  EASY MODE
                </p>
                <p className="text-sm text-slate-300">
                  Valid cards are highlighted with a green glow. You must play a valid card if you have one &mdash; no strategic passing.
                </p>
              </div>
              <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                <p className="text-blue-400 text-xs font-semibold mb-1">
                  HARD MODE
                </p>
                <p className="text-sm text-slate-300">
                  No highlights. You can strategically pass even when you
                  have valid moves &mdash; but you'll still have to give up a card!
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* 5. Winning */}
        <Section
          id="winning"
          title="Winning"
          subtitle="How the game ends"
          icon={<Trophy className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <p className="text-slate-300 leading-relaxed">
              The first player to <strong className="text-white">empty their hand wins</strong>.
              The game continues until all players have played all their cards, determining 2nd, 3rd, and 4th place.
            </p>

            <div className="flex items-center justify-center gap-4 py-4">
              {[
                { place: "1st", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { place: "2nd", color: "text-slate-300", bg: "bg-slate-700/30 border-slate-600/30" },
                { place: "3rd", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
              ].map(({ place, color, bg }) => (
                <div
                  key={place}
                  className={`px-5 py-3 rounded-xl border ${bg} text-center`}
                >
                  <p className={`text-lg font-bold ${color}`}>{place}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Empty hand
                  </p>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-400">
              Strategy tip: don't just play cards as fast as possible. Holding
              onto certain cards (especially in Spades) can block your opponents
              from playing while you find a way to empty your hand.
            </p>
          </div>
        </Section>

        {/* 6. Try It */}
        <Section
          id="try-it"
          title="Try It Yourself"
          subtitle="Play a few hands to get the feel"
          icon={<Play className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Here's a mini sandbox with a curated hand. Play cards onto the board,
              and watch the rules in action. Valid moves glow green. Click invalid
              cards to see why they can't be played.
            </p>
            <PlayableSandbox />
          </div>
        </Section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center pt-8"
        >
          <p className="text-slate-400 mb-4">Ready to play?</p>
          <Link href="/setup">
            <Button
              size="lg"
              className="text-lg px-10 py-7 shadow-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Play className="mr-2 h-5 w-5 fill-current" />
              Start Playing
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// Small arrow component used in the goal section
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
