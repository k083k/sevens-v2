import { Button } from "@/components/ui/button";
import { Trophy, Medal, Home, RotateCcw, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { IPlayer } from "@/lib/game/types/types";
import { useSound } from "@/lib/sounds/useSound";

interface GameOverModalProps {
  visible: boolean;
  rankings: ReadonlyArray<string> | string[];
  players: ReadonlyArray<IPlayer> | IPlayer[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameOverModal({
  visible,
  rankings,
  players,
  onPlayAgain,
  onBackToMenu,
}: GameOverModalProps) {
  if (!visible) return null;

  const getPlayerName = (id: string) => {
    return players.find((p) => p.id === id)?.name || "Unknown";
  };

  const winner = rankings[0];
  const winnerName = getPlayerName(winner);
  const isPlayerWinner = winnerName === "You";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-slate-800"
      >
        <div className="p-8">
          {/* Winner Section */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className={`p-4 rounded-full ${isPlayerWinner ? "bg-emerald-900/30" : "bg-amber-900/30"}`}>
                <Trophy className={`h-16 w-16 ${isPlayerWinner ? "text-emerald-400" : "text-amber-400"}`} />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {isPlayerWinner ? "Victory!" : "Game Over"}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-400"
            >
              {isPlayerWinner ? "Congratulations! You won!" : `${winnerName} wins!`}
            </motion.p>
          </div>

          {/* Rankings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 space-y-2"
          >
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Final Rankings
            </h3>
            {rankings.map((playerId, index) => {
              const playerName = getPlayerName(playerId);
              return (
                <div
                  key={playerId}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    index === 0
                      ? "bg-emerald-900/20 border border-emerald-800"
                      : "bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8">
                    {index === 0 ? (
                      <Trophy className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Medal className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium ${index === 0 ? "text-emerald-100" : "text-slate-300"}`}>
                      {playerName}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">
                    {index === 0 ? "1st" : "2nd"}
                  </span>
                </div>
              );
            })}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            <Button
              onClick={() => {
                onPlayAgain();
              }}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              size="lg"
            >
              <Swords className="mr-2 h-4 w-4" />
              Rematch
            </Button>
            <Button
              onClick={onBackToMenu}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Menu
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
