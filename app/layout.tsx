import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Sevens — The Classic Card Game",
    template: "%s | Sevens",
  },
  description:
    "Play the classic Sevens card game online. Build sequences from 7s, master the spades lock rule, and outsmart AI opponents or friends in real-time multiplayer.",
  keywords: [
    "sevens",
    "card game",
    "online",
    "multiplayer",
    "strategy",
    "playing cards",
  ],
  authors: [{ name: "Sevens Game" }],
  openGraph: {
    title: "Sevens — The Classic Card Game",
    description:
      "Build sequences from 7s, master the spades lock, and be the first to empty your hand. Play solo vs AI or with friends online.",
    type: "website",
    siteName: "Sevens",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Sevens — The Classic Card Game",
    description:
      "Play the classic Sevens card game online against AI or friends.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
