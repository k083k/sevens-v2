export default function LobbyLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading lobby...</p>
      </div>
    </div>
  );
}
