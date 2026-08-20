content = """import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { CopilotChat } from "@/components/chat/CopilotChat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Patient Journey Intelligence | CTS Hackathon",
  description:
    "Patient Journey and Funnel Drop-off Analytics - Monitor, investigate, understand, predict and act on patient leakage across the Diagnosis to First Fill journey.",
  keywords: ["patient journey", "funnel analytics", "prior authorization", "market access"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AppShell>{children}</AppShell>
        <CopilotChat />
      </body>
    </html>
  );
}
"""

with open(r"x:\login\frontend\src\app\layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
