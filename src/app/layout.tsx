import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { TimerProvider } from "@/contexts/timer-context";
import { ActiveTimerBanner } from "@/components/timer/active-timer-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Coding Starter Kit",
  description: "Built with AI Agent Team System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TimerProvider>
          {/* BUG-10 fix: banner lives here so it persists on all pages without flickering */}
          <ActiveTimerBanner />
          {children}
        </TimerProvider>
        <Toaster />
      </body>
    </html>
  );
}
