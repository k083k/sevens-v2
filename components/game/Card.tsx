import { memo } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CardProps {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: string | number;
  isValid?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
}

export const Card = memo(function Card({ suit, rank, isValid = false, disabled = false, onClick, size = "medium" }: CardProps) {
  const suitMap: Record<string, string> = {
    hearts: "heart",
    diamonds: "diamond",
    clubs: "club",
    spades: "spade",
  };

  const rankMap: Record<string, string> = {
    "1": "1",
    "11": "jack",
    "12": "queen",
    "13": "king",
  };

  const sizeClasses = {
    small: { width: 64, height: 96 },
    medium: { width: 80, height: 112 },
    large: { width: 96, height: 128 },
  };

  const imageSuit = suitMap[suit];
  const rankStr = rank.toString();
  const imageRank = rankMap[rankStr] || rankStr;
  const imagePath = `/cards/${imageSuit}_${imageRank}.png`;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-label={`${rank} of ${suit}${isValid ? " — valid move" : ""}`}
      className={cn(
        "relative rounded-lg shadow-lg transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
        isValid && !disabled
          ? "ring-4 ring-emerald-400 ring-offset-1 ring-offset-slate-900 hover:scale-105 active:scale-95 cursor-pointer animate-valid-pulse"
          : "",
        disabled && "opacity-60 cursor-not-allowed",
        !disabled && onClick && !isValid && "hover:scale-105 active:scale-95 hover:shadow-xl cursor-pointer"
      )}
      style={{
        width: sizeClasses[size].width,
        height: sizeClasses[size].height,
        boxShadow: isValid
          ? "0 10px 40px rgba(16, 185, 129, 0.4), 0 2px 8px rgba(0,0,0,0.2)"
          : "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <Image
        src={imagePath}
        alt={`${rank} of ${suit}`}
        width={sizeClasses[size].width}
        height={sizeClasses[size].height}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Valid card glow overlay */}
      {isValid && !disabled && (
        <div className="absolute inset-0 bg-emerald-500/15 pointer-events-none" />
      )}
    </button>
  );
});
