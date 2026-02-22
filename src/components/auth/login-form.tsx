"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

// BUG-4 fix: only allow relative internal redirects
function getSafeRedirect(raw: string | null): string {
  if (!raw) return "/dashboard";
  // Must start with "/" but not "//" (protocol-relative) and contain no ":"
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes(":")) {
    return raw;
  }
  return "/dashboard";
}

// BUG-6 fix: simple in-memory rate limiter (5 failures → 15 min lockout)
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));

  // BUG-2 fix: surface ?error= param from auth callback (e.g. expired reset link)
  const callbackError = searchParams.get("error");
  const initialError =
    callbackError === "auth_callback_error"
      ? "Your password reset link has expired or is invalid. Please request a new one."
      : null;

  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  // BUG-6: track failed attempts in-memory
  const failedAttempts = useRef(0);
  const lockoutUntil = useRef<number | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    // BUG-6: check lockout before making any request
    if (lockoutUntil.current && Date.now() < lockoutUntil.current) {
      const remaining = Math.ceil((lockoutUntil.current - Date.now()) / 60000);
      setError(`Too many failed attempts. Please try again in ${remaining} minute(s).`);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        // BUG-6: track failure and apply lockout after max attempts
        failedAttempts.current += 1;
        if (failedAttempts.current >= MAX_FAILURES) {
          lockoutUntil.current = Date.now() + LOCKOUT_MS;
          failedAttempts.current = 0;
          setError("Too many failed attempts. Please try again in 15 minutes.");
        } else {
          setError("Invalid email or password. Please try again.");
        }
        return;
      }

      if (data.session) {
        // BUG-4: redirectTo is already validated — safe to use
        window.location.href = redirectTo;
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              {callbackError === "auth_callback_error" && (
                <>
                  {" "}
                  <Link href="/forgot-password" className="underline underline-offset-2">
                    Request a new link
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Forgot your password?
          </Link>
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </Form>
  );
}
