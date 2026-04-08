import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play",
  description: "Play Sevens against AI. Build card sequences from 7s and be the first to empty your hand.",
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
