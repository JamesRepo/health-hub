"use client";

import { cn } from "@/lib/utils";

const PILLS = [
  { value: 0, label: "0", tone: "good" },
  { value: 1, label: "1-3", tone: "ok" },
  { value: 4, label: "4-6", tone: "warn" },
  { value: 7, label: "7+", tone: "bad" },
  { value: 10, label: "\u{1F389}", tone: "purple" },
] as const;

type Tone = (typeof PILLS)[number]["tone"];

const toneStyles: Record<Tone, string> = {
  good: "bg-green-500/[0.16] text-green-500 border-green-500/40",
  ok: "bg-yellow-500/[0.16] text-yellow-500 border-yellow-500/40",
  warn: "bg-orange-500/[0.16] text-orange-500 border-orange-500/40",
  bad: "bg-red-500/[0.16] text-red-500 border-red-500/40",
  purple: "bg-violet-500/[0.14] text-violet-400 border-violet-500/40",
};

export function AlcoholSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  // Which pill is active — both 7+ and party show the exact-units input
  const isHighRange = value !== null && value >= 7;

  const handlePillClick = (pillVal: number) => {
    // Deselect if clicking the currently-active pill
    if (
      (pillVal < 7 && value === pillVal) ||
      (pillVal >= 7 && isHighRange)
    ) {
      onChange(null);
    } else if (pillVal >= 7) {
      onChange(pillVal);
    } else {
      onChange(pillVal);
    }
  };

  // Determine which pill to highlight
  const activePill = (pillVal: number) => {
    if (value === null) return false;
    if (pillVal === 0) return value === 0;
    if (pillVal === 1) return value >= 1 && value <= 3;
    if (pillVal === 4) return value >= 4 && value <= 6;
    // For 7+ and party: highlight whichever was clicked (stored value matches)
    if (pillVal === 7) return value >= 7 && value <= 9;
    if (pillVal === 10) return value >= 10;
    return false;
  };

  return (
    <>
      <div className="grid grid-cols-5 gap-2">
        {PILLS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={cn(
              "flex min-h-14 flex-col items-center justify-center rounded-xl border bg-[#1c1c1c] px-2 py-3.5 transition-all active:scale-[0.97]",
              activePill(o.value)
                ? toneStyles[o.tone]
                : "border-[#222] text-[#a3a3a3] hover:border-[#333] hover:text-[#e5e5e5]",
            )}
            onClick={() => handlePillClick(o.value)}
          >
            <span className="font-mono text-lg font-medium leading-none">
              {o.label}
            </span>
          </button>
        ))}
      </div>
      {isHighRange && (
        <div className="mt-2.5 flex items-center gap-2.5">
          <label className="font-mono text-xs tracking-wide text-[#a3a3a3]">
            Exact units
          </label>
          <input
            type="number"
            min={7}
            value={value ?? 7}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n) && n >= 7) onChange(n);
            }}
            className="flex-1 rounded-lg border border-[#222] bg-[#1a1a1a] px-3 py-2.5 font-mono text-base text-[#e5e5e5] outline-none focus:border-green-500"
          />
        </div>
      )}
    </>
  );
}
