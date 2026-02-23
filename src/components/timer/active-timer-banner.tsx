"use client";

import { useTimerContext } from "@/contexts/timer-context";
import { TimerDisplay } from "@/components/timer/timer-display";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Square, Loader2 } from "lucide-react";
import Link from "next/link";

/**
 * Persistent banner that displays the currently running timer.
 * Shown across all pages so the user always knows which task is being tracked.
 */
export function ActiveTimerBanner() {
  const { activeTimer, elapsedSeconds, isLoading, stopTimer } =
    useTimerContext();
  const { toast } = useToast();

  if (!activeTimer) {
    return null;
  }

  // BUG-2 fix: show a toast with a Retry action when stop fails
  const handleStop = async () => {
    const result = await stopTimer();
    if (!result.success && result.error) {
      toast({
        title: "Failed to stop timer",
        description: result.error,
        variant: "destructive",
        action: (
          <ToastAction altText="Retry" onClick={handleStop}>
            Retry
          </ToastAction>
        ),
      });
    }
  };

  return (
    <div
      className="border-b bg-primary/5"
      role="status"
      aria-label="Active timer"
    >
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          {/* Pulsing indicator */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>

          {/* Timer display */}
          <TimerDisplay
            seconds={elapsedSeconds}
            className="text-sm font-semibold text-foreground"
          />

          {/* Task and project info */}
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            <Link
              href={`/projects/${activeTimer.project_id}`}
              className="hover:underline"
            >
              {activeTimer.project_name}
            </Link>
            {" / "}
            <span className="font-medium text-foreground">
              {activeTimer.task_name}
            </span>
          </span>
        </div>

        {/* Stop button */}
        <Button
          variant="destructive"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-xs"
          onClick={handleStop}
          disabled={isLoading}
          aria-label="Stop timer"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Square className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">Stop</span>
        </Button>
      </div>
    </div>
  );
}
