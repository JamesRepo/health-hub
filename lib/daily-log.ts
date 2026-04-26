import prisma from "@/lib/prisma";

export async function getEntry(date: string) {
  const logDate = new Date(date + "T00:00:00");

  const log = await prisma.dailyLog.findUnique({
    where: { logDate },
    include: {
      exercises: {
        include: { activityType: true },
        orderBy: { slotNumber: "asc" },
      },
    },
  });

  return log;
}

export async function getActivityTypes() {
  return prisma.activityType.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getGarminDataForDate(date: string) {
  const logDate = new Date(date + "T00:00:00");

  const log = await prisma.dailyLog.findUnique({
    where: { logDate },
    select: {
      garminSleepScore: true,
      garminSleepSeconds: true,
      garminDeepSeconds: true,
      garminLightSeconds: true,
      garminRemSeconds: true,
      garminAwakeSeconds: true,
      garminRestingHr: true,
      garminStressAvg: true,
      garminBodyBattery: true,
      garminHrvStatus: true,
    },
  });

  if (!log) return null;

  // Only return if there's any Garmin data
  const hasData = Object.values(log).some((v) => v !== null);
  return hasData ? log : null;
}

export async function getLatestGarminSync() {
  const sync = await prisma.garminSync.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, status: true },
  });
  return sync;
}
