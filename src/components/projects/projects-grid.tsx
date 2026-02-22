"use client";

import { ProjectCard } from "@/components/projects/project-card";
import type { Project } from "@/lib/validations/project";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectsGridProps {
  projects: Project[];
  loading: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <Skeleton className="h-3.5 w-3.5" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function ProjectsGrid({ projects, loading, onEdit, onDelete }: ProjectsGridProps) {
  if (loading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Loading projects"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Projects"
    >
      {projects.map((project) => (
        <div key={project.id} role="listitem">
          <ProjectCard
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
