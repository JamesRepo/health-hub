"use client";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: 1, emoji: "\u{1F634}", label: "Bad", tone: "bad" },
  { value: 2, emoji: "\u{1F611}", label: "OK", tone: "ok" },
  { value: 3, emoji: "\u{1F60A}", label: "Good", tone: "good" },
] as const;

type Tone = (typeof OPTIONS)[number]["tone"];

const toneStyles: Record<Tone, string> = {
  bad: "bg-red-500/[0.16] text-red-500 border-red-500/40",
  ok: "bg-yellow-500/[0.16] text-yellow-500 border-yellow-500/40",
  good: "bg-green-500/[0.16] text-green-500 border-green-500/40",
};

export function SleepSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border bg-[#1c1c1c] px-2 py-3.5 transition-all active:scale-[0.97]",
            value === o.value
              ? toneStyles[o.tone]
              : "border-[#222] text-[#a3a3a3] hover:border-[#333] hover:text-[#e5e5e5]",
          )}
          onClick={() => onChange(value === o.value ? null : o.value)}
        >
          <span className="text-[22px] leading-none">{o.emoji}</span>
          <span className="text-xs font-medium">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
