"use client";

import { useCallback } from "react";
import { useTimerContext } from "@/contexts/timer-context";

/**
 * Hook for timer operations on a specific task.
 * Wraps the global TimerContext with task-specific helpers.
 */
export function useTimer(taskId: string) {
  const {
    activeTimer,
    elapsedSeconds,
    isLoading,
    startTimer,
    stopTimer,
  } = useTimerContext();

  /** Whether this specific task has the active timer */
  const isActive = activeTimer?.task_id === taskId;

  /** Elapsed seconds for this task (0 if not the active task) */
  const taskElapsedSeconds = isActive ? elapsedSeconds : 0;

  /** Toggle: start if not active, stop if active */
  const toggle = useCallback(async () => {
    if (isActive) {
      return stopTimer();
    } else {
      return startTimer(taskId);
    }
  }, [isActive, startTimer, stopTimer, taskId]);

  return {
    isActive,
    elapsedSeconds: taskElapsedSeconds,
    isLoading,
    toggle,
    startTimer: () => startTimer(taskId),
    stopTimer,
  };
}
