import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();

const prismaMock = {
  dailyLog: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  exerciseEntry: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  activityType: {
    findMany: vi.fn(),
  },
  garminSync: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn((fn: (tx: typeof prismaMock) => Promise<unknown>) =>
    fn(prismaMock),
  ),
};

const authMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

describe("saveEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "1" } });
    prismaMock.dailyLog.upsert.mockResolvedValue({ id: 1 });
    prismaMock.exerciseEntry.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.exerciseEntry.createMany.mockResolvedValue({ count: 0 });
  });

  it("saves a valid entry with all fields", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const result = await saveEntry({
      date: "2026-04-24",
      mood: 3,
      sleepQuality: 2,
      alcoholUnits: 2,
      sexActivity: "None",
      totalExerciseSeconds: 2700,
      stepCount: 8432,
      didStretch: true,
      notes: "Good day",
      exercises: [{ activityTypeId: 1, slotNumber: 1 }],
    });

    expect(result).toEqual({ success: true, id: 1 });
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.dailyLog.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { logDate: new Date("2026-04-24T00:00:00") },
        create: expect.objectContaining({
          mood: 3,
          sleepQuality: 2,
          alcoholUnits: 2,
          didStretch: true,
        }),
      }),
    );
    expect(prismaMock.exerciseEntry.createMany).toHaveBeenCalledWith({
      data: [{ dailyLogId: 1, activityTypeId: 1, slotNumber: 1 }],
    });
  });

  it("saves a minimal entry with all nullable fields as null", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const result = await saveEntry({
      date: "2026-04-24",
      mood: null,
      sleepQuality: null,
      alcoholUnits: null,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [],
    });

    expect(result).toEqual({ success: true, id: 1 });
    expect(prismaMock.exerciseEntry.createMany).not.toHaveBeenCalled();
  });

  it("revalidates entry and history paths after save", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    await saveEntry({
      date: "2026-04-24",
      mood: 1,
      sleepQuality: 1,
      alcoholUnits: 0,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [],
    });

    expect(revalidatePathMock).toHaveBeenCalledWith("/entry");
    expect(revalidatePathMock).toHaveBeenCalledWith("/entry/2026-04-24");
    expect(revalidatePathMock).toHaveBeenCalledWith("/history");
  });

  it("deletes existing exercises before creating new ones", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const callOrder: string[] = [];
    prismaMock.exerciseEntry.deleteMany.mockImplementation(() => {
      callOrder.push("delete");
      return Promise.resolve({ count: 2 });
    });
    prismaMock.exerciseEntry.createMany.mockImplementation(() => {
      callOrder.push("create");
      return Promise.resolve({ count: 1 });
    });

    await saveEntry({
      date: "2026-04-24",
      mood: 3,
      sleepQuality: 3,
      alcoholUnits: 0,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [{ activityTypeId: 2, slotNumber: 1 }],
    });

    expect(callOrder).toEqual(["delete", "create"]);
  });

  it("rejects an invalid date format", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const result = await saveEntry({
      date: "24/04/2026",
      mood: 3,
      sleepQuality: 2,
      alcoholUnits: null,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [],
    });

    expect(result).toHaveProperty("error");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects mood values outside 1-3", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const result = await saveEntry({
      date: "2026-04-24",
      mood: 5,
      sleepQuality: 2,
      alcoholUnits: null,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [],
    });

    expect(result).toHaveProperty("error");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects sleep quality values outside 1-3", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const result = await saveEntry({
      date: "2026-04-24",
      mood: null,
      sleepQuality: 0,
      alcoholUnits: null,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [],
    });

    expect(result).toHaveProperty("error");
  });

  it("rejects negative alcohol units", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const result = await saveEntry({
      date: "2026-04-24",
      mood: null,
      sleepQuality: null,
      alcoholUnits: -2,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [],
    });

    expect(result).toHaveProperty("error");
  });

  it("rejects exercise slot numbers outside 1-4", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const result = await saveEntry({
      date: "2026-04-24",
      mood: null,
      sleepQuality: null,
      alcoholUnits: null,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [{ activityTypeId: 1, slotNumber: 5 }],
    });

    expect(result).toHaveProperty("error");
  });

  it("rejects more than 4 exercises", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const result = await saveEntry({
      date: "2026-04-24",
      mood: null,
      sleepQuality: null,
      alcoholUnits: null,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [
        { activityTypeId: 1, slotNumber: 1 },
        { activityTypeId: 2, slotNumber: 2 },
        { activityTypeId: 3, slotNumber: 3 },
        { activityTypeId: 4, slotNumber: 4 },
        { activityTypeId: 5, slotNumber: 1 },
      ],
    });

    expect(result).toHaveProperty("error");
  });

  it("rejects notes longer than 1000 characters", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    const result = await saveEntry({
      date: "2026-04-24",
      mood: null,
      sleepQuality: null,
      alcoholUnits: null,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: "x".repeat(1001),
      exercises: [],
    });

    expect(result).toHaveProperty("error");
  });

  it("returns an error when the database transaction fails", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    prismaMock.$transaction.mockRejectedValueOnce(new Error("DB down"));

    const result = await saveEntry({
      date: "2026-04-24",
      mood: 2,
      sleepQuality: 2,
      alcoholUnits: null,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [],
    });

    expect(result).toEqual({ error: "Failed to save entry. Please try again." });
  });

  it("rejects unauthenticated requests", async () => {
    const { saveEntry } = await import("../actions/daily-log");

    authMock.mockResolvedValueOnce(null);

    const result = await saveEntry({
      date: "2026-04-24",
      mood: 2,
      sleepQuality: 2,
      alcoholUnits: null,
      sexActivity: null,
      totalExerciseSeconds: null,
      stepCount: null,
      didStretch: false,
      notes: null,
      exercises: [],
    });

    expect(result).toEqual({ error: "Not authenticated." });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("getEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries by date and includes exercises with activity types", async () => {
    const { getEntry } = await import("../lib/daily-log");

    prismaMock.dailyLog.findUnique.mockResolvedValue({
      id: 1,
      mood: 3,
      exercises: [],
    });

    const result = await getEntry("2026-04-24");

    expect(prismaMock.dailyLog.findUnique).toHaveBeenCalledWith({
      where: { logDate: new Date("2026-04-24T00:00:00") },
      include: {
        exercises: {
          include: { activityType: true },
          orderBy: { slotNumber: "asc" },
        },
      },
    });
    expect(result).toEqual({ id: 1, mood: 3, exercises: [] });
  });

  it("returns null when no entry exists for the date", async () => {
    const { getEntry } = await import("../lib/daily-log");

    prismaMock.dailyLog.findUnique.mockResolvedValue(null);

    const result = await getEntry("2026-01-01");

    expect(result).toBeNull();
  });
});

describe("getActivityTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all activity types sorted by name", async () => {
    const { getActivityTypes } = await import("../lib/daily-log");

    const mockTypes = [
      { id: 1, name: "Cycle", emoji: "🚴" },
      { id: 2, name: "Run", emoji: "🏃" },
    ];
    prismaMock.activityType.findMany.mockResolvedValue(mockTypes);

    const result = await getActivityTypes();

    expect(prismaMock.activityType.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
    });
    expect(result).toEqual(mockTypes);
  });
});

describe("getGarminDataForDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns garmin data when present", async () => {
    const { getGarminDataForDate } = await import("../lib/daily-log");

    const garminData = {
      garminSleepScore: 85,
      garminSleepSeconds: 28800,
      garminDeepSeconds: 7200,
      garminLightSeconds: 14400,
      garminRemSeconds: 5400,
      garminAwakeSeconds: 1800,
      garminRestingHr: 58,
      garminStressAvg: 32,
      garminBodyBattery: 75,
      garminHrvStatus: 45,
    };
    prismaMock.dailyLog.findUnique.mockResolvedValue(garminData);

    const result = await getGarminDataForDate("2026-04-24");

    expect(result).toEqual(garminData);
  });

  it("returns null when no log exists for the date", async () => {
    const { getGarminDataForDate } = await import("../lib/daily-log");

    prismaMock.dailyLog.findUnique.mockResolvedValue(null);

    const result = await getGarminDataForDate("2026-04-24");

    expect(result).toBeNull();
  });

  it("returns null when all garmin fields are null", async () => {
    const { getGarminDataForDate } = await import("../lib/daily-log");

    prismaMock.dailyLog.findUnique.mockResolvedValue({
      garminSleepScore: null,
      garminSleepSeconds: null,
      garminDeepSeconds: null,
      garminLightSeconds: null,
      garminRemSeconds: null,
      garminAwakeSeconds: null,
      garminRestingHr: null,
      garminStressAvg: null,
      garminBodyBattery: null,
      garminHrvStatus: null,
    });

    const result = await getGarminDataForDate("2026-04-24");

    expect(result).toBeNull();
  });
});

describe("getLatestGarminSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the most recent sync record", async () => {
    const { getLatestGarminSync } = await import("../lib/daily-log");

    const syncRecord = {
      createdAt: new Date("2026-04-24T06:00:00Z"),
      status: "success",
    };
    prismaMock.garminSync.findFirst.mockResolvedValue(syncRecord);

    const result = await getLatestGarminSync();

    expect(prismaMock.garminSync.findFirst).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true },
    });
    expect(result).toEqual(syncRecord);
  });

  it("returns null when no sync records exist", async () => {
    const { getLatestGarminSync } = await import("../lib/daily-log");

    prismaMock.garminSync.findFirst.mockResolvedValue(null);

    const result = await getLatestGarminSync();

    expect(result).toBeNull();
  });
});
