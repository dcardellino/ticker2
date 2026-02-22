"use client";

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = {
  label: string;
  bars: number; // 1–4
  colorClass: string;
  textClass: string;
};

function getStrength(password: string): StrengthLevel | null {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { label: "Weak", bars: 1, colorClass: "bg-red-500", textClass: "text-red-500" };
  }
  if (score === 2) {
    return { label: "Fair", bars: 2, colorClass: "bg-orange-500", textClass: "text-orange-500" };
  }
  if (score === 3) {
    return { label: "Strong", bars: 3, colorClass: "bg-yellow-500", textClass: "text-yellow-500" };
  }
  return { label: "Very Strong", bars: 4, colorClass: "bg-green-500", textClass: "text-green-500" };
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = getStrength(password);

  if (!strength) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              segment <= strength.bars ? strength.colorClass : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength.textClass}`}>{strength.label}</p>
    </div>
  );
}
