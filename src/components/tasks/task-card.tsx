"use client";

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
import { Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
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

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const hasDescription = !!task.description;
  const isDescriptionTruncated =
    hasDescription && task.description!.length > DESCRIPTION_TRUNCATE_LENGTH;
  const truncatedDescription = isDescriptionTruncated
    ? task.description!.slice(0, DESCRIPTION_TRUNCATE_LENGTH) + "..."
    : task.description;

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <h3
          className="min-w-0 truncate text-base font-semibold leading-tight pr-2"
          title={task.name}
        >
          {task.name}
        </h3>
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
      </CardHeader>
      <CardContent className="pt-0">
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
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{formatTrackedTime(task.total_tracked_time ?? 0)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
