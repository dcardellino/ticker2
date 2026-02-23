"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Clock, Loader2, MoreVertical, Pencil, Play, Square, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTimer } from "@/hooks/use-timer";
import { TimerDisplay } from "@/components/timer/timer-display";
import { TimeEntriesSection } from "@/components/timer/time-entries-section";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/validations/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function formatTrackedTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0h 0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

const DESCRIPTION_TRUNCATE_LENGTH = 120;
const LONG_TIMER_THRESHOLD_SECONDS = 86_400; // 24 hours

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { isActive, elapsedSeconds, isLoading, toggle } = useTimer(task.id);
  const { toast } = useToast();

  // BUG-1 fix: track locally accumulated time from stopped sessions so the
  // displayed total stays accurate between the stop and the next server refetch.
  const [extraTrackedTime, setExtraTrackedTime] = useState(0);
  const elapsedRef = useRef(elapsedSeconds);
  const prevTotalRef = useRef(task.total_tracked_time ?? 0);

  // Keep a live ref to elapsed so handleToggle can read it synchronously.
  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  });

  // Reset extra time once the server value catches up (after refetch).
  useEffect(() => {
    const serverTotal = task.total_tracked_time ?? 0;
    if (serverTotal > prevTotalRef.current) {
      setExtraTrackedTime(0);
    }
    prevTotalRef.current = serverTotal;
  }, [task.total_tracked_time]);

  const hasDescription = !!task.description;
  const isDescriptionTruncated =
    hasDescription && task.description!.length > DESCRIPTION_TRUNCATE_LENGTH;
  const truncatedDescription = isDescriptionTruncated
    ? task.description!.slice(0, DESCRIPTION_TRUNCATE_LENGTH) + "..."
    : task.description;

  // Calculate total tracked time including live elapsed seconds (BUG-1 fix applied)
  const displayedTrackedTime = isActive
    ? (task.total_tracked_time ?? 0) + extraTrackedTime + elapsedSeconds
    : (task.total_tracked_time ?? 0) + extraTrackedTime;

  // BUG-3 fix: warn when a timer has been running for more than 24 hours
  const isLongRunning = isActive && elapsedSeconds >= LONG_TIMER_THRESHOLD_SECONDS;

  const handleToggle = async () => {
    const wasActive = isActive;
    const capturedElapsed = elapsedRef.current;
    const result = await toggle();
    if (!result.success && result.error) {
      toast({
        title: "Timer error",
        description: result.error,
        variant: "destructive",
      });
    } else if (wasActive && result.success && capturedElapsed > 0) {
      // BUG-1 fix: accumulate the elapsed seconds locally so displayed total
      // stays correct until useTasks refetches fresh data from the server.
      setExtraTrackedTime((prev) => prev + capturedElapsed);
    }
  };

  return (
    <Card
      className={cn(
        "group relative transition-all",
        isActive
          ? "border-primary/50 bg-primary/[0.03] shadow-md ring-1 ring-primary/20"
          : "hover:shadow-md"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        {/* BUG-5 fix: use flex-wrap so narrow screens don't overflow */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pr-2">
          {/* Play/Stop button */}
          <Button
            variant={isActive ? "destructive" : "default"}
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0",
              !isActive && "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
            )}
            onClick={handleToggle}
            disabled={isLoading}
            aria-label={isActive ? `Stop timer for ${task.name}` : `Start timer for ${task.name}`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isActive ? (
              <Square className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <h3
            className="min-w-0 truncate text-base font-semibold leading-tight"
            title={task.name}
          >
            {task.name}
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Active timer pulsing indicator */}
          {isActive && (
            <span className="relative flex h-2.5 w-2.5 mr-1" aria-label="Timer is running">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                aria-label={`Actions for ${task.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* BUG-3 fix: warn when timer has been running for more than 24 hours */}
        {isLongRunning && (
          <div className="mb-3 flex items-center gap-1.5 rounded-md border border-yellow-200 bg-yellow-50 px-2.5 py-1.5 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Timer has been running for over 24 hours. Did you forget to stop it?</span>
          </div>
        )}

        {hasDescription && (
          <div className="mb-3">
            {isDescriptionTruncated ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="cursor-default text-sm text-muted-foreground">
                      {truncatedDescription}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-xs whitespace-pre-wrap"
                  >
                    {task.description}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
          </div>
        )}

        {/* Time tracking info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatTrackedTime(displayedTrackedTime)}</span>
          </div>

          {/* Live timer counter when active */}
          {isActive && (
            <TimerDisplay
              seconds={elapsedSeconds}
              className="text-sm font-semibold text-primary"
            />
          )}
        </div>

        {/* Time entries history */}
        <div className="mt-3 border-t pt-2">
          <TimeEntriesSection
            taskId={task.id}
            isTimerActive={isActive}
          />
        </div>
      </CardContent>
    </Card>
  );
}
