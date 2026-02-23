import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { timeEntriesQuerySchema } from "@/lib/validations/time-entry";
import { checkRateLimit } from "@/lib/rate-limit";

// Max 60 list requests per user per minute
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function GET(request: NextRequest) {
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
    if (!checkRateLimit(`list:${user.id}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = timeEntriesQuerySchema.safeParse({
      task_id: searchParams.get("task_id"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { task_id: taskId } = parsed.data;

    // Fetch completed time entries for the task (only those with ended_at)
    const { data: entries, error: fetchError } = await supabase
      .from("time_entries")
      .select("*")
      .eq("task_id", taskId)
      .eq("user_id", user.id)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch time entries" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: entries ?? [] });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
