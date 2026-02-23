"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { ActiveTimerEntry } from "@/lib/validations/time-entry";

interface TimerContextValue {
  /** The currently active timer entry, or null if no timer is running */
  activeTimer: ActiveTimerEntry | null;
  /** Elapsed seconds since the active timer started */
  elapsedSeconds: number;
  /** Whether a start/stop operation is in progress */
  isLoading: boolean;
  /** Start a timer for a given task */
  startTimer: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  /** Stop the currently active timer */
  stopTimer: () => Promise<{ success: boolean; error?: string; discarded?: boolean }>;
  /** Re-fetch the active timer from the server (e.g., after tab focus) */
  refreshActiveTimer: () => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimerEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabaseRef = useRef(createSupabaseBrowserClient());

  // Calculate elapsed seconds from a start time
  const calcElapsed = useCallback((startedAt: string) => {
    return Math.max(
      0,
      Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    );
  }, []);

  // Start the interval to tick elapsed seconds
  const startInterval = useCallback(
    (startedAt: string) => {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Set initial value
      setElapsedSeconds(calcElapsed(startedAt));
      // Tick every second
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(calcElapsed(startedAt));
      }, 1000);
    },
    [calcElapsed]
  );

  // Stop the interval
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsedSeconds(0);
  }, []);

  // Auth page paths — no timer state needed on these pages
  const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

  // Fetch active timer on mount (detects open entries from previous sessions)
  const refreshActiveTimer = useCallback(async () => {
    // BUG-9 fix: skip auth check on unauthenticated pages to avoid a wasted
    // network request on pages where the user is not logged in.
    if (typeof window !== "undefined" && AUTH_PATHS.includes(window.location.pathname)) {
      return;
    }

    try {
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setActiveTimer(null);
        stopInterval();
        return;
      }

      // Find any open time entry for this user
      const { data: openEntries, error } = await supabase
        .from("time_entries")
        .select("id, task_id, started_at, tasks(name, project_id, projects(name))")
        .eq("user_id", user.id)
        .is("ended_at", null)
        .limit(1);

      if (error || !openEntries || openEntries.length === 0) {
        setActiveTimer(null);
        stopInterval();
        return;
      }

      const entry = openEntries[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const taskData = entry.tasks as any;
      const projectData = taskData?.projects;

      const active: ActiveTimerEntry = {
        id: entry.id,
        task_id: entry.task_id,
        started_at: entry.started_at,
        task_name: taskData?.name ?? "Unknown task",
        project_name: projectData?.name ?? "Unknown project",
        project_id: taskData?.project_id ?? "",
      };

      setActiveTimer(active);
      startInterval(active.started_at);
    } catch {
      // Silently fail - timer will appear as not running
    }
  }, [startInterval, stopInterval]);

  // Initial load
  useEffect(() => {
    refreshActiveTimer();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume timer on tab focus (handles the case where the tab was backgrounded)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshActiveTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refreshActiveTimer]);

  // BUG-4 fix: Supabase Realtime subscription so that changes made in other
  // browser tabs (start/stop) are reflected in this tab immediately.
  useEffect(() => {
    const supabase = supabaseRef.current;
    let userId: string | null = null;

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel(`timer-sync-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "time_entries",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Any INSERT/UPDATE/DELETE on this user's time_entries: re-sync
            refreshActiveTimer();
          }
        )
        .subscribe();

      return channel;
    }

    let channelPromise: ReturnType<typeof subscribe> | null = null;
    channelPromise = subscribe();

    return () => {
      channelPromise?.then((channel) => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
  }, [refreshActiveTimer]);

  const startTimer = useCallback(
    async (
      taskId: string
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/time-entries/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: taskId }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error ?? "Failed to start timer" };
        }

        // Refresh active timer state to get full task/project info
        await refreshActiveTimer();
        return { success: true };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshActiveTimer]
  );

  const stopTimer = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
    discarded?: boolean;
  }> => {
    if (!activeTimer) {
      return { success: false, error: "No active timer to stop" };
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/time-entries/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: activeTimer.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error ?? "Failed to stop timer" };
      }

      setActiveTimer(null);
      stopInterval();

      return {
        success: true,
        discarded: result.discarded ?? false,
      };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  }, [activeTimer, stopInterval]);

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        elapsedSeconds,
        isLoading,
        startTimer,
        stopTimer,
        refreshActiveTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimerContext must be used within a TimerProvider");
  }
  return context;
}
