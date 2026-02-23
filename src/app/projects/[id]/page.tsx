"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Project } from "@/lib/validations/project";
import type { Task, TaskFormValues } from "@/lib/validations/task";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TasksList } from "@/components/tasks/tasks-list";
import { TasksEmptyState } from "@/components/tasks/tasks-empty-state";
import { CreateEditTaskDialog } from "@/components/tasks/create-edit-task-dialog";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { AlertCircle, ArrowLeft, Loader2, Plus } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { user, loading: authLoading } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError, createTask, updateTask, deleteTask, refetch } = useTasks(projectId);
  const { toast } = useToast();

  // Project data
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Dialog state
  const [createEditOpen, setCreateEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch project data
  useEffect(() => {
    if (!projectId || authLoading) return;
    if (!user) return;

    async function fetchProject() {
      setProjectLoading(true);
      setProjectError(null);
      try {
        const { data, error } = await supabaseRef.current
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error || !data) {
          // Project not found or not owned by user (RLS will block access)
          setProjectError("Project not found.");
          return;
        }

        setProject(data);
      } catch {
        setProjectError("An unexpected error occurred while loading the project.");
      } finally {
        setProjectLoading(false);
      }
    }

    fetchProject();
  }, [projectId, user, authLoading]);

  // Redirect to login when session expires client-side
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = `/login?redirect=/projects/${projectId}`;
    }
  }, [user, authLoading, projectId]);

  // Redirect to projects if project not found (after loading)
  useEffect(() => {
    if (!projectLoading && projectError === "Project not found.") {
      router.push("/projects");
    }
  }, [projectLoading, projectError, router]);

  const handleCreateClick = useCallback(() => {
    setSelectedTask(null);
    setCreateEditOpen(true);
  }, []);

  const handleEditClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setCreateEditOpen(true);
  }, []);

  const handleDeleteClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setDeleteOpen(true);
  }, []);

  const handleCreateEditSubmit = useCallback(
    async (values: TaskFormValues) => {
      if (selectedTask) {
        const result = await updateTask(selectedTask.id, values);
        if (result.success) {
          toast({ title: "Task updated", description: `"${values.name}" has been updated.` });
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        return result;
      } else {
        const result = await createTask(values);
        if (result.success) {
          toast({ title: "Task created", description: `"${values.name}" has been added.` });
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        return result;
      }
    },
    [selectedTask, updateTask, createTask, toast]
  );

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      const taskName = selectedTask?.name ?? "Task";
      const result = await deleteTask(id);
      if (result.success) {
        toast({ title: "Task deleted", description: `"${taskName}" has been deleted.` });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      return result;
    },
    [selectedTask, deleteTask, toast]
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

  // Project loading state
  if (projectLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Project error state (redirect handled via useEffect)
  if (projectError || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showEmptyState = !tasksLoading && !tasksError && tasks.length === 0;
  const showList = !tasksError && tasks.length > 0;

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
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Projects
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-5 w-5 shrink-0 rounded-full"
              style={{ backgroundColor: project.color }}
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {project.name}
            </h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </Badge>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add task
          </Button>
        </div>

        {/* Error state */}
        {tasksError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{tasksError}</span>
              <Button variant="outline" size="sm" onClick={refetch}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty state */}
        {showEmptyState && <TasksEmptyState onCreateClick={handleCreateClick} />}

        {/* Tasks list */}
        {(showList || tasksLoading) && (
          <TasksList
            tasks={tasks}
            loading={tasksLoading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </main>

      {/* Dialogs */}
      <CreateEditTaskDialog
        open={createEditOpen}
        onOpenChange={setCreateEditOpen}
        task={selectedTask}
        onSubmit={handleCreateEditSubmit}
      />

      <DeleteTaskDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        task={selectedTask}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
