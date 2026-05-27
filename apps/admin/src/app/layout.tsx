import type { Metadata } from "next";

// Self-hosted via @fontsource — no network dependency at build or runtime
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-sans/800.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";

import "./globals.css";

export const metadata: Metadata = {
  title: "Loada Admin",
  description: "Loada platform administration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
