import { Card } from "./Card";
import { Suit, ICard } from "@/lib/game/types/types";
import { ArrowRight } from "lucide-react";

interface CardTransferModalProps {
  visible: boolean;
  fromPlayerName: string;
  toPlayerName: string;
  availableCards: ReadonlyArray<ICard> | ICard[];
  onSelectCard: (card: any) => void;
}

export function CardTransferModal({
  visible,
  fromPlayerName,
  toPlayerName,
  availableCards,
  onSelectCard,
}: CardTransferModalProps) {
  if (!visible) return null;

  const suitNames: Record<Suit, string> = {
    [Suit.HEARTS]: "hearts",
    [Suit.DIAMONDS]: "diamonds",
    [Suit.CLUBS]: "clubs",
    [Suit.SPADES]: "spades",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Select Card to Give
            </h2>
            <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="font-medium">{fromPlayerName}</span>
              <ArrowRight className="h-4 w-4" />
              <span className="font-medium">{toPlayerName}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Choose a card to give to the next player
            </p>
          </div>

          <div className="flex gap-3 justify-center flex-wrap max-h-[400px] overflow-y-auto p-2">
            {availableCards.map((card, index) => (
              <Card
                key={`${card.suit}-${card.rank}-${index}`}
                suit={suitNames[card.suit as Suit] as "hearts" | "diamonds" | "clubs" | "spades"}
                rank={card.rank}
                size="medium"
                onClick={() => onSelectCard(card)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
