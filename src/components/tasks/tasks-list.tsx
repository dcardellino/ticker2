"use client";

import { TaskCard } from "@/components/tasks/task-card";
import type { Task } from "@/lib/validations/task";
import { Skeleton } from "@/components/ui/skeleton";

interface TasksListProps {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-3/4" />
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <Skeleton className="h-3.5 w-3.5" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function TasksList({ tasks, loading, onEdit, onDelete }: TasksListProps) {
  if (loading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Loading tasks"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Tasks"
    >
      {tasks.map((task) => (
        <div key={task.id} role="listitem">
          <TaskCard
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
