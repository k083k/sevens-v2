import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Play",
  description:
    "Learn the rules of Sevens with interactive tutorials. Understand sequences, the spades lock rule, and try a playable sandbox.",
  openGraph: {
    title: "How to Play Sevens",
    description:
      "Interactive tutorial for the Sevens card game. Learn sequences, the spades lock rule, and practice with a sandbox.",
  },
};

export default function HowToPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
