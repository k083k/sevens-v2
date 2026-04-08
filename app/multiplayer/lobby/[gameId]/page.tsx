import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { LobbyClient } from "@/components/multiplayer/LobbyClient";

export const dynamic = "force-dynamic";

interface LobbyPageProps {
  params: Promise<{ gameId: string }>;
}

export default async function LobbyPage({ params }: LobbyPageProps) {
  const { gameId } = await params;

  // Fetch game data server-side — no loading spinner needed
  const { data: game, error: gameError } = await (supabaseServer
    .from("games") as any)
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    notFound();
  }

  // Fetch players server-side
  const { data: players } = await (supabaseServer
    .from("game_players") as any)
    .select("*")
    .eq("game_id", gameId)
    .order("seat_position");

  return (
    <LobbyClient
      initialGame={game}
      initialPlayers={players || []}
      gameId={gameId}
    />
  );
}
