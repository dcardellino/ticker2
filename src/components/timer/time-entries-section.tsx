"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import { formatDuration } from "@/components/timer/timer-display";
import type { TimeEntry } from "@/lib/validations/time-entry";

interface TimeEntriesSectionProps {
  taskId: string;
  /** Whether this task's timer is currently active (triggers refresh on stop) */
  isTimerActive: boolean;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeOnly(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameDay(a: string, b: string): boolean {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function TimeEntryRow({ entry }: { entry: TimeEntry }) {
  const startedAt = entry.started_at;
  const endedAt = entry.ended_at!;
  const sameDay = isSameDay(startedAt, endedAt);

  return (
    <div className="flex items-center justify-between py-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5 min-w-0">
        <span>{formatDateTime(startedAt)}</span>
        <span className="text-muted-foreground/60">-</span>
        <span>{sameDay ? formatTimeOnly(endedAt) : formatDateTime(endedAt)}</span>
      </div>
      <span className="shrink-0 tabular-nums font-mono font-medium text-foreground">
        {formatDuration(entry.duration_seconds ?? 0)}
      </span>
    </div>
  );
}

export function TimeEntriesSection({
  taskId,
  isTimerActive,
}: TimeEntriesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const prevIsTimerActiveRef = useRef(isTimerActive);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/time-entries?task_id=${taskId}`);
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Failed to load entries");
        return;
      }
      setEntries(result.data ?? []);
    } catch {
      setError("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Fetch entries when section is opened for the first time
  useEffect(() => {
    if (isOpen && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchEntries();
    }
  }, [isOpen, fetchEntries]);

  // Re-fetch when a timer stops for this task (isTimerActive transitions from true to false)
  useEffect(() => {
    if (prevIsTimerActiveRef.current && !isTimerActive && hasFetchedRef.current) {
      fetchEntries();
    }
    prevIsTimerActiveRef.current = isTimerActive;
  }, [isTimerActive, fetchEntries]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label={isOpen ? "Hide time entries" : "Show time entries"}
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <History className="h-3 w-3" />
          <span>History</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-0.5 rounded-md border bg-muted/30 p-3">
          {loading && (
            <div className="space-y-2" aria-label="Loading time entries">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-destructive">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={fetchEntries}
              >
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">
              No time entries yet.
            </p>
          )}

          {!loading &&
            !error &&
            entries.map((entry) => (
              <TimeEntryRow key={entry.id} entry={entry} />
            ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
