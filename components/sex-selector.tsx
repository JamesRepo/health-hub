"use client";

import { cn } from "@/lib/utils";

const OPTIONS = ["Good", "Bad", "Solo", "None"] as const;

export function SexSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o}
          type="button"
          className={cn(
            "flex min-h-12 items-center justify-center rounded-xl border bg-[#1c1c1c] px-1 py-3 transition-all active:scale-[0.97]",
            value === o
              ? "border-violet-500/40 bg-violet-500/[0.14] text-violet-400"
              : "border-[#222] text-[#a3a3a3] hover:border-[#333] hover:text-[#e5e5e5]",
          )}
          onClick={() => onChange(value === o ? null : o)}
        >
          <span className="text-xs font-medium">{o}</span>
        </button>
      ))}
    </div>
  );
}
