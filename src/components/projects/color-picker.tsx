"use client";

import { cn } from "@/lib/utils";
import { PROJECT_COLORS } from "@/lib/validations/project";
import { Check } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Project color">
      {PROJECT_COLORS.map((color) => {
        const isSelected = value === color.value;
        return (
          <button
            key={color.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={color.label}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected && "ring-2 ring-ring ring-offset-2"
            )}
            style={{ backgroundColor: color.value }}
            onClick={() => onChange(color.value)}
          >
            {isSelected && (
              <Check className="h-4 w-4 text-white" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
