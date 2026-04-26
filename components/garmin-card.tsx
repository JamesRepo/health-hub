"use client";

import { useState } from "react";
import {
  Activity,
  Battery,
  ChevronDown,
  Heart,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { cn } from "@/lib/utils";

type GarminData = {
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

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function scoreLabel(score: number): { text: string; className: string } {
  if (score >= 80) return { text: "Good", className: "text-green-500" };
  if (score >= 60) return { text: "Fair", className: "text-yellow-500" };
  return { text: "Poor", className: "text-red-500" };
}

function metricColor(value: number, thresholds: { good: number; ok: number }, invert = false): string {
  if (invert) {
    if (value <= thresholds.good) return "text-green-500";
    if (value <= thresholds.ok) return "text-yellow-500";
    return "text-red-500";
  }
  if (value >= thresholds.good) return "text-green-500";
  if (value >= thresholds.ok) return "text-yellow-500";
  return "text-red-500";
}

function barColor(value: number, thresholds: { good: number; ok: number }, invert = false): string {
  if (invert) {
    if (value <= thresholds.good) return "bg-green-500";
    if (value <= thresholds.ok) return "bg-yellow-500";
    return "bg-red-500";
  }
  if (value >= thresholds.good) return "bg-green-500";
  if (value >= thresholds.ok) return "bg-yellow-500";
  return "bg-red-500";
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="relative size-[84px] shrink-0">
      <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
        <circle cx="42" cy="42" r={r} stroke="#1a1a1a" strokeWidth="6" fill="none" />
        <circle
          cx="42" cy="42" r={r}
          stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-mono text-[22px] font-medium text-[#e5e5e5]">
        <div className="text-center">
          {score}
          <span className="mt-[-2px] block text-[9px] tracking-wider text-[#737373]">/100</span>
        </div>
      </div>
    </div>
  );
}

export function GarminCard({
  data,
  syncedAt,
}: {
  data: GarminData | null;
  syncedAt: Date | null;
}) {
  const [open, setOpen] = useState(false);

  if (!data) return null;

  const sleepScore = data.garminSleepScore;
  const totalSleep = data.garminSleepSeconds;
  const deep = data.garminDeepSeconds;
  const light = data.garminLightSeconds;
  const rem = data.garminRemSeconds;
  const awake = data.garminAwakeSeconds;

  const hasSleepStages = deep != null && light != null && rem != null && awake != null;
  const totalStages = hasSleepStages ? deep + light + rem + awake : 0;

  const stages = hasSleepStages && totalStages > 0
    ? [
        { label: "Deep", pct: Math.round((deep / totalStages) * 100), color: "#1d4ed8" },
        { label: "Light", pct: Math.round((light / totalStages) * 100), color: "#3b82f6" },
        { label: "REM", pct: Math.round((rem / totalStages) * 100), color: "#8b5cf6" },
        { label: "Awake", pct: Math.round((awake / totalStages) * 100), color: "#ef4444" },
      ]
    : null;

  const syncAge = syncedAt
    ? formatDistanceToNowStrict(syncedAt, { addSuffix: false }) + " ago"
    : null;

  const sl = sleepScore != null ? scoreLabel(sleepScore) : null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#222] bg-[#111]",
      )}
    >
      <div
        className="flex cursor-pointer select-none items-center justify-between px-4 py-3.5 hover:bg-[#1a1a1a]"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#e5e5e5]">
          <span className="text-base">{"\u231A"}</span>
          <span>Garmin Data</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#737373]">
          {syncAge && <span>synced {syncAge}</span>}
          <ChevronDown
            className={cn(
              "size-[18px] text-[#a3a3a3] transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </div>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-[#222] p-4">
          {sleepScore != null && (
            <div className="flex items-center gap-4">
              <ScoreRing score={sleepScore} color="#3b82f6" />
              <div className="flex-1">
                <div className="mb-1 text-[13px] text-[#a3a3a3]">Sleep score</div>
                <div className={cn("text-lg font-semibold tracking-tight", sl?.className)}>
                  {sl?.text} &middot; {sleepScore}/100
                </div>
                {totalSleep != null && (
                  <div className="mt-1 font-mono text-[11px] text-[#737373]">
                    {formatDuration(totalSleep)} total
                  </div>
                )}
              </div>
            </div>
          )}

          {stages && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-medium text-[#a3a3a3]">
                <span>Sleep stages</span>
                {totalSleep != null && (
                  <span className="font-mono text-[#737373]">
                    {formatDuration(totalSleep)}
                  </span>
                )}
              </div>
              <div className="flex h-3 overflow-hidden rounded">
                {stages.map((s) => (
                  <div key={s.label} style={{ flex: s.pct, background: s.color }} />
                ))}
              </div>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {stages.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 font-mono text-[11px] text-[#a3a3a3]">
                    <span className="size-2 rounded-sm" style={{ background: s.color }} />
                    <span>{s.label} {s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {data.garminRestingHr != null && (
              <MetricTile
                icon={<Heart className="size-3" />}
                label="RESTING HR"
                value={data.garminRestingHr}
                unit="bpm"
                colorClass={metricColor(data.garminRestingHr, { good: 60, ok: 70 }, true)}
                barPct={Math.min(data.garminRestingHr, 100)}
                barClass={barColor(data.garminRestingHr, { good: 60, ok: 70 }, true)}
              />
            )}
            {data.garminStressAvg != null && (
              <MetricTile
                icon={<Activity className="size-3" />}
                label="STRESS"
                value={data.garminStressAvg}
                unit="/100"
                colorClass={metricColor(data.garminStressAvg, { good: 40, ok: 60 }, true)}
                barPct={data.garminStressAvg}
                barClass={barColor(data.garminStressAvg, { good: 40, ok: 60 }, true)}
              />
            )}
            {data.garminBodyBattery != null && (
              <MetricTile
                icon={<Battery className="size-3" />}
                label="BODY BATTERY"
                value={data.garminBodyBattery}
                unit="/100"
                colorClass={metricColor(data.garminBodyBattery, { good: 70, ok: 40 })}
                barPct={data.garminBodyBattery}
                barClass={barColor(data.garminBodyBattery, { good: 70, ok: 40 })}
              />
            )}
            {data.garminHrvStatus != null && (
              <MetricTile
                icon={<Activity className="size-3" />}
                label="HRV"
                value={data.garminHrvStatus}
                unit="ms"
                colorClass="text-violet-400"
                barPct={Math.min((data.garminHrvStatus / 80) * 100, 100)}
                barClass="bg-violet-500"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  unit,
  colorClass,
  barPct,
  barClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  colorClass: string;
  barPct: number;
  barClass: string;
}) {
  return (
    <div className="rounded-[10px] border border-[#222] bg-[#1a1a1a] p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] tracking-wide text-[#a3a3a3]">
        {icon}
        {label}
      </div>
      <div className={cn("font-mono text-[22px] font-medium tracking-tight", colorClass)}>
        {value}
        <span className="ml-0.5 text-[11px] text-[#737373]">{unit}</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#0a0a0a]">
        <span className={cn("block h-full", barClass)} style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
}
