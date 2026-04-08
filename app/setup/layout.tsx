import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Setup",
  description: "Configure your Sevens game — choose single or multiplayer, easy or hard mode.",
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
