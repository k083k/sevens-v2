import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface CannotPlayModalProps {
  visible: boolean;
  playerName: string;
  onAcknowledge: () => void;
}

export function CannotPlayModal({ visible, playerName, onAcknowledge }: CannotPlayModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Cannot Play
            </h2>
          </div>

          <div className="mb-6">
            <p className="text-slate-700 dark:text-slate-300 mb-2">
              <strong>{playerName}</strong> has no valid moves!
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              They must take a card from the previous player.
            </p>
          </div>

          <Button
            onClick={onAcknowledge}
            className="w-full"
            size="lg"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
