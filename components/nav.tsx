"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  Calendar,
  BarChart3,
  Brain,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "@/actions/auth";

type SyncStatus = "good" | "partial" | "failed" | "unknown";

const mainNav = [
  { href: "/", label: "Dashboard", mobileLabel: "Dashboard", icon: Home },
  { href: "/entry", label: "Log Entry", mobileLabel: "Log", icon: PlusCircle },
  { href: "/history", label: "History", mobileLabel: "History", icon: Calendar },
  { href: "/analytics", label: "Analytics", mobileLabel: "Analytics", icon: BarChart3 },
  { href: "/insights", label: "Insights", mobileLabel: "Insights", icon: Brain },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function SyncDot({ status }: { status: SyncStatus }) {
  const colors: Record<SyncStatus, string> = {
    good: "bg-[#22c55e] shadow-[0_0_0_3px_rgba(34,197,94,0.15)]",
    partial: "bg-[#eab308] shadow-[0_0_0_3px_rgba(234,179,8,0.15)]",
    failed: "bg-[#ef4444] shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
    unknown: "bg-[#737373] shadow-[0_0_0_3px_rgba(115,115,115,0.15)]",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status]}`} />;
}

function SyncLabel({ status, syncAge }: { status: SyncStatus; syncAge: string | null }) {
  if (status === "unknown") return <span className="font-mono text-[11px] text-[#737373]">no data</span>;
  const labels: Record<SyncStatus, string> = {
    good: "synced",
    partial: "partial",
    failed: "failed",
    unknown: "",
  };
  return (
    <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#a3a3a3]">
      <SyncDot status={status} />
      <span>{labels[status]}{syncAge ? ` ${syncAge}` : ""}</span>
    </span>
  );
}

export type GarminSyncInfo = {
  status: SyncStatus;
  syncAge: string | null;
};

export default function Nav({ garminSync }: { garminSync: GarminSyncInfo }) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#222] bg-[#111] md:flex">
        <div className="flex flex-col gap-1 px-3 pt-5">
          {/* Logo */}
          <div className="mb-4 flex items-center gap-2.5 border-b border-[#222] px-3 pb-5">
            <span className="text-[22px] leading-none drop-shadow-[0_0_8px_rgba(34,197,94,0.35)]">
              🫀
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-[#22c55e]">
              Health Hub
            </span>
          </div>

          {/* Main section */}
          <span className="px-3 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#737373]">
            Main
          </span>
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[rgba(34,197,94,0.08)] text-[#22c55e]"
                    : "text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-[#e5e5e5]"
                }`}
              >
                {active && (
                  <span className="absolute -left-3 bottom-1.5 top-1.5 w-[3px] rounded-r bg-[#22c55e]" />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Garmin sync status */}
        <div className="px-3">
          <div className="flex items-center justify-between px-3 pb-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#737373]">
              Garmin
            </span>
            <SyncLabel status={garminSync.status} syncAge={garminSync.syncAge} />
          </div>

          <div className="my-3 h-px bg-[#222]" />

          {/* Admin */}
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(pathname, "/admin")
                ? "bg-[rgba(34,197,94,0.08)] text-[#22c55e]"
                : "text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-[#e5e5e5]"
            }`}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">Admin</span>
            <SyncDot status={garminSync.status} />
          </Link>

          {/* Sign out */}
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a3a3a3] transition-colors hover:bg-[#1a1a1a] hover:text-[#e5e5e5]"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span>Sign out</span>
            </button>
          </form>

          <div className="my-3 h-px bg-[#222]" />

          {/* User row */}
          <div className="mb-5 flex items-center gap-2.5 px-3 py-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-xs font-semibold text-[#052e13]">
              J
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-[13px] font-medium leading-tight text-[#e5e5e5]">
                James
              </span>
              <span className="truncate font-mono text-[11px] leading-tight text-[#737373]">
                health.hammez.net
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#222] bg-[rgba(17,17,17,0.92)] backdrop-blur-[14px] md:hidden">
        <div className="grid grid-cols-5">
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-0.5 pb-[18px] pt-2 transition-colors ${
                  active ? "text-[#22c55e]" : "text-[#737373]"
                }`}
              >
                <item.icon className="h-[22px] w-[22px]" />
                <span className="text-[10px] font-medium tracking-[0.02em]">
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Mobile header ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#222] bg-[#0a0a0a] px-5 py-3 md:hidden">
        <div className="flex items-center gap-2 text-base font-semibold tracking-tight text-[#22c55e]">
          <span className="text-lg">🫀</span>
          <span>Health Hub</span>
        </div>
        {garminSync.status !== "unknown" && (
          <span className={`flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px] ${
            ({
              good: "border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)] text-[#22c55e]",
              partial: "border-[rgba(234,179,8,0.2)] bg-[rgba(234,179,8,0.08)] text-[#eab308]",
              failed: "border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] text-[#ef4444]",
              unknown: "",
            })[garminSync.status]
          }`}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
            <span>{garminSync.syncAge ?? "synced"}</span>
          </span>
        )}
      </header>
    </>
  );
}
