import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Stats",
  description: "Track your Sevens game performance — wins, losses, streaks, and game history.",
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
