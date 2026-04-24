import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";

import { auth } from "@/lib/auth";
import Nav, { type GarminSyncInfo } from "@/components/nav";
import prisma from "@/lib/prisma";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Health Hub",
  description: "Personal health metrics tracker",
};

async function getGarminSync(): Promise<GarminSyncInfo> {
  try {
    const latest = await prisma.garminSync.findFirst({
      orderBy: { createdAt: "desc" },
      select: { status: true, createdAt: true },
    });

    if (!latest) return { status: "unknown", syncAge: null };

    const syncAge = formatDistanceToNowStrict(latest.createdAt, {
      addSuffix: false,
    });

    const statusMap: Record<string, GarminSyncInfo["status"]> = {
      success: "good",
      partial: "partial",
      failed: "failed",
    };

    return {
      status: statusMap[latest.status] ?? "unknown",
      syncAge,
    };
  } catch {
    return { status: "unknown", syncAge: null };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const showNav = !!session;
  const garminSync = showNav ? await getGarminSync() : null;

  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0a0a] font-sans text-[#e5e5e5]">
        {showNav && garminSync ? (
          <div className="flex min-h-screen flex-col md:flex-row">
            <Nav garminSync={garminSync} />
            <main className="min-w-0 flex-1 pb-20 md:ml-64 md:pb-0">
              {children}
            </main>
          </div>
        ) : (
          children
        )}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
