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

export function Card({ suit, rank, isValid = false, disabled = false, onClick, size = "medium" }: CardProps) {
  // Convert suit name from plural to singular for image filename
  const suitMap: Record<string, string> = {
    hearts: "heart",
    diamonds: "diamond",
    clubs: "club",
    spades: "spade",
  };

  // Convert rank to image filename format
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
      className={cn(
        "relative rounded-lg shadow-lg transition-all duration-200 overflow-hidden",
        isValid && !disabled
          ? "ring-4 ring-emerald-400 ring-offset-2 hover:scale-105 cursor-pointer"
          : "",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && onClick && !isValid && "hover:scale-105 hover:shadow-xl cursor-pointer"
      )}
      style={{
        width: sizeClasses[size].width,
        height: sizeClasses[size].height,
        boxShadow: isValid
          ? "0 10px 40px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0,0,0,0.1)"
          : "0 4px 12px rgba(0,0,0,0.1)",
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
        <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
      )}
    </button>
  );
}
