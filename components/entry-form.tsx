"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, subDays, isToday } from "date-fns";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveEntry, type SaveEntryInput } from "@/actions/daily-log";
import { MoodSelector } from "@/components/mood-selector";
import { SleepSelector } from "@/components/sleep-selector";
import { AlcoholSelector } from "@/components/alcohol-selector";
import { SexSelector } from "@/components/sex-selector";
import {
  ExerciseSlots,
  type ActivityType,
  type ExerciseSlotData,
} from "@/components/exercise-slots";
import { GarminCard } from "@/components/garmin-card";

type ExistingEntry = {
  mood: number | null;
  sleepQuality: number | null;
  alcoholUnits: number | null;
  sexActivity: string | null;
  totalExerciseSeconds: number | null;
  stepCount: number | null;
  didStretch: boolean;
  notes: string | null;
  exercises: {
    slotNumber: number;
    activityType: ActivityType;
  }[];
  garminSleepScore: number | null;
  garminSleepSeconds: number | null;
  garminDeepSeconds: number | null;
  garminLightSeconds: number | null;
  garminRemSeconds: number | null;
  garminAwakeSeconds: number | null;
  garminRestingHr: number | null;
  garminStressAvg: number | null;
  garminBodyBattery: number | null;
  garminHrvStatus: number | null;
};

function secondsToTimeString(seconds: number | null): string {
  if (seconds == null || seconds === 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function timeStringToSeconds(time: string): number | null {
  if (!time.trim()) return null;
  const parts = time.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (h < 0 || m < 0 || m > 59 || s < 0 || s > 59) return null;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    if (m < 0 || s < 0 || s > 59) return null;
    return m * 60 + s;
  }
  return null;
}

function buildSlots(
  exercises: { slotNumber: number; activityType: ActivityType }[],
): ExerciseSlotData[] {
  const slots: ExerciseSlotData[] = [
    { slotNumber: 1, activity: null },
    { slotNumber: 2, activity: null },
    { slotNumber: 3, activity: null },
    { slotNumber: 4, activity: null },
  ];
  for (const ex of exercises) {
    const idx = ex.slotNumber - 1;
    if (idx >= 0 && idx < 4) {
      slots[idx] = { slotNumber: ex.slotNumber, activity: ex.activityType };
    }
  }
  return slots;
}

export function EntryForm({
  initialDate,
  entry,
  activities,
  garminSyncedAt,
}: {
  initialDate: Date;
  entry: ExistingEntry | null;
  activities: ActivityType[];
  garminSyncedAt: Date | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState(initialDate);
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [sleep, setSleep] = useState<number | null>(
    entry?.sleepQuality ?? null,
  );
  const [alcohol, setAlcohol] = useState<number | null>(
    entry?.alcoholUnits ?? null,
  );
  const [sex, setSex] = useState<string | null>(entry?.sexActivity ?? null);
  const [slots, setSlots] = useState<ExerciseSlotData[]>(
    buildSlots(entry?.exercises ?? []),
  );
  const [totalTime, setTotalTime] = useState(
    secondsToTimeString(entry?.totalExerciseSeconds ?? null),
  );
  const [steps, setSteps] = useState(
    entry?.stepCount != null ? String(entry.stepCount) : "",
  );
  const [stretched, setStretched] = useState(entry?.didStretch ?? false);
  const [notes, setNotes] = useState(entry?.notes ?? "");

  const garminData = entry
    ? {
        garminSleepScore: entry.garminSleepScore,
        garminSleepSeconds: entry.garminSleepSeconds,
        garminDeepSeconds: entry.garminDeepSeconds,
        garminLightSeconds: entry.garminLightSeconds,
        garminRemSeconds: entry.garminRemSeconds,
        garminAwakeSeconds: entry.garminAwakeSeconds,
        garminRestingHr: entry.garminRestingHr,
        garminStressAvg: entry.garminStressAvg,
        garminBodyBattery: entry.garminBodyBattery,
        garminHrvStatus: entry.garminHrvStatus,
      }
    : null;

  const hasGarmin = garminData && Object.values(garminData).some((v) => v !== null);

  const navigateDate = useCallback(
    (newDate: Date) => {
      setDate(newDate);
      const dateStr = format(newDate, "yyyy-MM-dd");
      if (isToday(newDate)) {
        router.push("/entry");
      } else {
        router.push(`/entry/${dateStr}`);
      }
    },
    [router],
  );

  const handleSave = useCallback(() => {
    const exerciseData = slots
      .filter((s) => s.activity !== null)
      .map((s) => ({
        activityTypeId: s.activity!.id,
        slotNumber: s.slotNumber,
      }));

    const input: SaveEntryInput = {
      date: format(date, "yyyy-MM-dd"),
      mood,
      sleepQuality: sleep,
      alcoholUnits: alcohol,
      sexActivity: sex,
      totalExerciseSeconds: timeStringToSeconds(totalTime),
      stepCount: steps ? parseInt(steps, 10) || null : null,
      didStretch: stretched,
      notes: notes.trim() || null,
      exercises: exerciseData,
    };

    startTransition(async () => {
      const result = await saveEntry(input);
      if ("error" in result && result.error) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Validation failed. Check your inputs.",
        );
      } else {
        toast.success("Saved");
      }
    });
  }, [date, mood, sleep, alcohol, sex, slots, totalTime, steps, stretched, notes]);

  // Keyboard shortcut: Cmd+S / Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const dateInfo = {
    weekday: format(date, "EEEE"),
    full: format(date, "d MMMM yyyy"),
    isToday: isToday(date),
  };

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-7">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 border-b border-[#222] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[26px] font-semibold tracking-tight text-[#e5e5e5]">
              Daily entry
            </h2>
            <div className="mt-1 text-[13px] text-[#a3a3a3]">
              {dateInfo.weekday}, {dateInfo.full}
            </div>
          </div>
          <DateBar
            isToday={dateInfo.isToday}
            weekday={dateInfo.weekday}
            full={dateInfo.full}
            onPrev={() => navigateDate(subDays(date, 1))}
            onNext={() => navigateDate(addDays(date, 1))}
          />
        </div>

        {/* Two-column layout on desktop, single on mobile */}
        <div className="grid grid-cols-1 items-start gap-5 md:gap-8 lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-5 lg:max-w-[640px]">
            <Section label="Mood">
              <MoodSelector value={mood} onChange={setMood} />
            </Section>

            <Section label="Sleep quality">
              <SleepSelector value={sleep} onChange={setSleep} />
            </Section>

            <Section label={<>Drinks {"\u{1F37A}"}</>}>
              <AlcoholSelector value={alcohol} onChange={setAlcohol} />
            </Section>

            <Section label="Sex">
              <SexSelector value={sex} onChange={setSex} />
            </Section>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5 lg:max-w-[640px]">
            <Section label={<>Exercise {"\u{1F3C3}"}</>}>
              <ExerciseSlots
                slots={slots}
                onSlotsChange={setSlots}
                activities={activities}
                totalTime={totalTime}
                onTotalTimeChange={setTotalTime}
                steps={steps}
                onStepsChange={setSteps}
                stretched={stretched}
                onStretchedChange={setStretched}
              />
            </Section>

            <Section label="Notes">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes\u2026"
                className="h-[52px] w-full rounded-xl border border-[#222] bg-[#1a1a1a] px-3.5 text-[15px] text-[#e5e5e5] outline-none placeholder:text-[#737373] focus:border-green-500 focus:bg-[#1d1d1d]"
              />
            </Section>

            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="flex h-14 max-w-[280px] flex-1 items-center justify-center gap-2 rounded-[14px] bg-green-500 text-base font-semibold text-[#052e13] transition-colors hover:bg-green-600 active:scale-[0.99] disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="size-[18px] animate-spin" />
                ) : (
                  <Check className="size-[18px]" />
                )}
                Save
              </button>
              <span className="hidden font-mono text-xs text-[#737373] md:inline">
                {"\u2318"} + S to save
              </span>
            </div>
          </div>
        </div>

        {/* Garmin card at bottom */}
        {hasGarmin && (
          <div className="mt-8">
            <GarminCard data={garminData} syncedAt={garminSyncedAt} />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#1a1a1a] p-4 md:p-[18px]">
      <div className="mb-2.5 flex items-center gap-1.5 text-sm font-medium text-[#a3a3a3] md:mb-3 md:text-[14px]">
        {label}
      </div>
      {children}
    </div>
  );
}

function DateBar({
  isToday: today,
  weekday,
  full,
  onPrev,
  onNext,
}: {
  isToday: boolean;
  weekday: string;
  full: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="grid grid-cols-[48px_1fr_48px] items-center md:min-w-[300px]">
      <button
        type="button"
        onClick={onPrev}
        className="grid size-10 place-items-center rounded-full border border-[#222] bg-[#1a1a1a] text-[#a3a3a3] transition-colors hover:border-[#333] hover:bg-[#232323] hover:text-[#e5e5e5]"
        aria-label="Previous day"
      >
        <ChevronLeft className="size-[18px]" />
      </button>
      <div className="text-center">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[#737373]">
          {weekday}
        </div>
        <div
          className={`text-base font-semibold tracking-tight ${today ? "text-green-500" : "text-[#e5e5e5]"}`}
        >
          {full}
        </div>
        {today && (
          <span className="mt-1 inline-block rounded-full bg-green-500/[0.12] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-green-500">
            Today
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="grid size-10 place-items-center rounded-full border border-[#222] bg-[#1a1a1a] text-[#a3a3a3] transition-colors hover:border-[#333] hover:bg-[#232323] hover:text-[#e5e5e5]"
        aria-label="Next day"
      >
        <ChevronRight className="size-[18px]" />
      </button>
    </div>
  );
}
