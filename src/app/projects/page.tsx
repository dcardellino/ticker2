"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectsGrid } from "@/components/projects/projects-grid";
import { ProjectsEmptyState } from "@/components/projects/projects-empty-state";
import { CreateEditProjectDialog } from "@/components/projects/create-edit-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import type { Project, ProjectFormValues } from "@/lib/validations/project";
import { AlertCircle, ArrowLeft, Loader2, Plus } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const { projects, loading: projectsLoading, error, createProject, updateProject, deleteProject, refetch } = useProjects();
  const { toast } = useToast();

  // Dialog state
  const [createEditOpen, setCreateEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Redirect to login when session expires client-side
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login?redirect=/projects";
    }
  }, [user, authLoading]);

  const handleCreateClick = useCallback(() => {
    setSelectedProject(null);
    setCreateEditOpen(true);
  }, []);

  const handleEditClick = useCallback((project: Project) => {
    setSelectedProject(project);
    setCreateEditOpen(true);
  }, []);

  const handleDeleteClick = useCallback((project: Project) => {
    setSelectedProject(project);
    setDeleteOpen(true);
  }, []);

  const handleCreateEditSubmit = useCallback(
    async (values: ProjectFormValues) => {
      if (selectedProject) {
        const result = await updateProject(selectedProject.id, values);
        if (result.success) {
          toast({ title: "Project updated", description: `"${values.name}" has been updated.` });
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        return result;
      } else {
        const result = await createProject(values);
        if (result.success) {
          toast({ title: "Project created", description: `"${values.name}" has been created.` });
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        return result;
      }
    },
    [selectedProject, updateProject, createProject, toast]
  );

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      const projectName = selectedProject?.name ?? "Project";
      const result = await deleteProject(id);
      if (result.success) {
        toast({ title: "Project deleted", description: `"${projectName}" has been deleted.` });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      return result;
    },
    [selectedProject, deleteProject, toast]
  );

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!user) {
    return null;
  }

  const showEmptyState = !projectsLoading && !error && projects.length === 0;
  const showGrid = !error && projects.length > 0;

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-primary-foreground"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="text-lg font-semibold">Time Tracker</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your projects and track time across your work.
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New project
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty state */}
        {showEmptyState && <ProjectsEmptyState onCreateClick={handleCreateClick} />}

        {/* Projects grid */}
        {(showGrid || projectsLoading) && (
          <ProjectsGrid
            projects={projects}
            loading={projectsLoading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </main>

      {/* Dialogs */}
      <CreateEditProjectDialog
        open={createEditOpen}
        onOpenChange={setCreateEditOpen}
        project={selectedProject}
        onSubmit={handleCreateEditSubmit}
      />

      <DeleteProjectDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        project={selectedProject}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
