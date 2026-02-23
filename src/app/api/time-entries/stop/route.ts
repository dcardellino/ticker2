import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { stopTimerSchema } from "@/lib/validations/time-entry";
import { checkRateLimit } from "@/lib/rate-limit";

const MIN_DURATION_SECONDS = 1;
// Max 20 timer stops per user per minute
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
    if (!checkRateLimit(`stop:${user.id}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const parsed = stopTimerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { entry_id } = parsed.data;

    // Fetch the open entry (must belong to user and have no ended_at)
    const { data: entry, error: fetchError } = await supabase
      .from("time_entries")
      .select("*")
      .eq("id", entry_id)
      .eq("user_id", user.id)
      .is("ended_at", null)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: "Active time entry not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const startedAt = new Date(entry.started_at);
    const durationSeconds = Math.max(
      0,
      Math.floor((now.getTime() - startedAt.getTime()) / 1000)
    );

    // Discard entries shorter than 1 second
    if (durationSeconds < MIN_DURATION_SECONDS) {
      await supabase
        .from("time_entries")
        .delete()
        .eq("id", entry_id);

      return NextResponse.json({
        data: null,
        discarded: true,
        message: "Entry discarded (duration less than 1 second)",
      });
    }

    // Update the entry with ended_at and duration
    const { data: updatedEntry, error: updateError } = await supabase
      .from("time_entries")
      .update({
        ended_at: now.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq("id", entry_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to stop timer" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedEntry });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
