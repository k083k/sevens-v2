import Link from "next/link";

export default function LobbyNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Game Not Found
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          This game doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
