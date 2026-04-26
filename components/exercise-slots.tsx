"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ActivityType = {
  id: number;
  name: string;
  emoji: string | null;
};

export type ExerciseSlotData = {
  slotNumber: number;
  activity: ActivityType | null;
};

function ExerciseSlot({
  slot,
  activities,
  onPick,
  onClear,
}: {
  slot: ExerciseSlotData;
  activities: ActivityType[];
  onPick: (a: ActivityType) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (slot.activity) {
    return (
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-500/[0.28] bg-green-500/10 px-3 py-2.5 text-sm font-medium text-green-400">
        {slot.activity.emoji && <span>{slot.activity.emoji}</span>}
        <span>{slot.activity.name}</span>
        <button
          type="button"
          onClick={onClear}
          className="inline-grid size-[18px] place-items-center rounded-full bg-green-500/20 text-xs text-green-400 hover:bg-green-500/[0.32]"
          aria-label={`Remove ${slot.activity.name}`}
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  const filtered = activities.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative" ref={ref}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[#737373]" />
      <input
        type="text"
        placeholder={`Slot ${slot.slotNumber} \u2014 search activity\u2026`}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-[52px] w-full rounded-xl border border-[#222] bg-[#1a1a1a] py-3.5 pl-[42px] pr-3.5 text-[15px] text-[#e5e5e5] outline-none transition-colors focus:border-green-500 focus:bg-[#1d1d1d]"
      />
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 max-h-60 overflow-auto rounded-xl border border-[#333] bg-[#111] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="flex cursor-pointer items-center gap-2.5 border-b border-[#222] px-3.5 py-3 text-sm text-[#e5e5e5] last:border-b-0 hover:bg-[#1a1a1a]"
              onClick={() => {
                onPick(a);
                setQuery("");
                setOpen(false);
              }}
            >
              {a.emoji && <span className="text-lg">{a.emoji}</span>}
              <span>{a.name}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3.5 py-3 text-sm text-[#737373]">
              No matches
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExerciseSlots({
  slots,
  onSlotsChange,
  activities,
  totalTime,
  onTotalTimeChange,
  steps,
  onStepsChange,
  stretched,
  onStretchedChange,
}: {
  slots: ExerciseSlotData[];
  onSlotsChange: (slots: ExerciseSlotData[]) => void;
  activities: ActivityType[];
  totalTime: string;
  onTotalTimeChange: (v: string) => void;
  steps: string;
  onStepsChange: (v: string) => void;
  stretched: boolean;
  onStretchedChange: (v: boolean) => void;
}) {
  const [minVisible, setMinVisible] = useState(0);
  const filledCount = slots.filter((s) => s.activity).length;
  const visibleCount = Math.min(Math.max(1, filledCount + 1, minVisible), 4);
  const visible = slots.slice(0, visibleCount);

  const addSlot = useCallback(() => {
    setMinVisible(visibleCount + 1);
  }, [visibleCount]);

  return (
    <div className="flex flex-col gap-2.5">
      {visible.map((s) => (
        <ExerciseSlot
          key={s.slotNumber}
          slot={s}
          activities={activities}
          onPick={(a) =>
            onSlotsChange(
              slots.map((x) =>
                x.slotNumber === s.slotNumber ? { ...x, activity: a } : x,
              ),
            )
          }
          onClear={() =>
            onSlotsChange(
              slots.map((x) =>
                x.slotNumber === s.slotNumber ? { ...x, activity: null } : x,
              ),
            )
          }
        />
      ))}

      {visibleCount < 4 && (
        <button
          type="button"
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-dashed border-[#333] bg-transparent px-3 py-2 text-[13px] font-medium text-[#a3a3a3] hover:border-green-500 hover:text-green-500"
          onClick={addSlot}
        >
          <Plus className="size-3.5" /> Add another
        </button>
      )}

      <div className="mt-1 grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-[#737373]">
            Total time
          </label>
          <input
            type="text"
            value={totalTime}
            onChange={(e) => onTotalTimeChange(e.target.value)}
            placeholder="00:00:00"
            className="h-12 rounded-[10px] border border-[#222] bg-[#1a1a1a] px-3 font-mono text-base text-[#e5e5e5] outline-none placeholder:text-[#737373] focus:border-green-500"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-[#737373]">
            Steps
          </label>
          <input
            type="number"
            value={steps}
            onChange={(e) => onStepsChange(e.target.value)}
            placeholder="Garmin sync"
            className="h-12 rounded-[10px] border border-[#222] bg-[#1a1a1a] px-3 font-mono text-base text-[#e5e5e5] outline-none placeholder:text-[#737373] focus:border-green-500"
          />
        </div>
      </div>

      <div
        className="mt-0.5 flex cursor-pointer select-none items-center gap-2.5 rounded-[10px] border border-[#222] bg-[#1a1a1a] px-3.5 py-3 hover:border-[#333]"
        onClick={() => onStretchedChange(!stretched)}
        role="checkbox"
        aria-checked={stretched}
      >
        <span
          className={cn(
            "inline-grid size-[22px] shrink-0 place-items-center rounded-md border transition-colors",
            stretched
              ? "border-green-500 bg-green-500"
              : "border-[#333] bg-[#0a0a0a]",
          )}
        >
          {stretched && <Check className="size-3.5 text-[#052e13]" />}
        </span>
        <span className="flex-1 text-sm text-[#e5e5e5]">Stretched today</span>
        <span className="font-mono text-[11px] text-[#737373]">~10 min</span>
      </div>
    </div>
  );
}
