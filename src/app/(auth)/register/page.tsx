import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign Up - Time Tracker",
  description: "Create a new Time Tracker account",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Get started with your free time tracking account"
    >
      <RegisterForm />
    </AuthCard>
  );
}
