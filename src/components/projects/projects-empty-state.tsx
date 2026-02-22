"use client";

import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";

interface ProjectsEmptyStateProps {
  onCreateClick: () => void;
}

export function ProjectsEmptyState({ onCreateClick }: ProjectsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Create your first project to start tracking time across your work.
      </p>
      <Button className="mt-6" onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Create your first project
      </Button>
    </div>
  );
}
