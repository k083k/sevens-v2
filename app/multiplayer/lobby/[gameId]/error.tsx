"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function LobbyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex p-4 bg-red-500/10 rounded-full mb-6">
          <AlertTriangle className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Lobby Error
        </h2>
        <p className="text-slate-400 mb-6">
          There was a problem loading the lobby. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" className="border-slate-600 text-slate-300">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
