import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { startTimerSchema } from "@/lib/validations/time-entry";
import { checkRateLimit } from "@/lib/rate-limit";

// Max 20 timer starts per user per minute
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Server-side rate limiting (per user)
    if (!checkRateLimit(`start:${user.id}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const parsed = startTimerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { task_id } = parsed.data;

    // Verify the task exists (RLS will filter by user ownership implicitly)
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, project_id")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // BUG-7 fix: explicit project ownership check (defense in depth beyond RLS)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", task.project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Stop any currently running timer for this user
    const { data: openEntries } = await supabase
      .from("time_entries")
      .select("id, started_at")
      .eq("user_id", user.id)
      .is("ended_at", null)
      .limit(10);

    if (openEntries && openEntries.length > 0) {
      const now = new Date().toISOString();
      for (const entry of openEntries) {
        const durationSeconds = Math.max(
          0,
          Math.floor(
            (new Date(now).getTime() - new Date(entry.started_at).getTime()) / 1000
          )
        );
        await supabase
          .from("time_entries")
          .update({
            ended_at: now,
            duration_seconds: durationSeconds,
          })
          .eq("id", entry.id);
      }
    }

    // Create new time entry with started_at
    const { data: newEntry, error: insertError } = await supabase
      .from("time_entries")
      .insert({
        task_id,
        user_id: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to start timer" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newEntry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
