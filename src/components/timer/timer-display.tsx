"use client";

import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  /** Total elapsed seconds to display */
  seconds: number;
  /** Optional additional class names */
  className?: string;
}

/**
 * Formats seconds into HH:MM:SS display.
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

export function TimerDisplay({ seconds, className }: TimerDisplayProps) {
  return (
    <span
      className={cn("tabular-nums font-mono", className)}
      aria-live="polite"
      aria-label={`Timer: ${formatDuration(seconds)}`}
    >
      {formatDuration(seconds)}
    </span>
  );
}
