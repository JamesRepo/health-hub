import { beforeEach, describe, expect, it, vi } from "vitest";

const getEntryMock = vi.fn();
const getActivityTypesMock = vi.fn();
const getLatestGarminSyncMock = vi.fn();
const EntryFormMock = vi.fn((props: Record<string, unknown>) => props);

vi.mock("@/lib/daily-log", () => ({
  getEntry: getEntryMock,
  getActivityTypes: getActivityTypesMock,
  getLatestGarminSync: getLatestGarminSyncMock,
}));

vi.mock("@/components/entry-form", () => ({
  EntryForm: EntryFormMock,
}));

vi.mock("date-fns", async () => {
  const actual = await vi.importActual<typeof import("date-fns")>("date-fns");
  return {
    ...actual,
    format: actual.format,
  };
});

function flattenChildren(element: unknown): unknown[] {
  if (element == null || typeof element === "boolean") return [];
  if (typeof element === "string" || typeof element === "number")
    return [element];
  if (Array.isArray(element)) return element.flatMap(flattenChildren);

  const el = element as { props?: { children?: unknown } };
  if (el.props?.children != null) {
    return [element, ...flattenChildren(el.props.children)];
  }
  return [element];
}

describe("entry page (today)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEntryMock.mockResolvedValue(null);
    getActivityTypesMock.mockResolvedValue([
      { id: 1, name: "Run", emoji: "🏃" },
    ]);
    getLatestGarminSyncMock.mockResolvedValue(null);
  });

  it("fetches data and renders EntryForm with today's date", async () => {
    const { default: DailyEntryPage } = await import("../app/entry/page");

    const tree = await DailyEntryPage();

    expect(getEntryMock).toHaveBeenCalled();
    expect(getActivityTypesMock).toHaveBeenCalled();
    expect(getLatestGarminSyncMock).toHaveBeenCalled();

    const nodes = flattenChildren(tree);
    const entryForm = nodes.find(
      (n) => (n as { type?: unknown }).type === EntryFormMock,
    ) as { props: Record<string, unknown> } | undefined;

    expect(entryForm).toBeDefined();
    expect(entryForm!.props.entry).toBeNull();
    expect(entryForm!.props.activities).toEqual([
      { id: 1, name: "Run", emoji: "🏃" },
    ]);
    expect(entryForm!.props.garminSyncedAt).toBeNull();
    expect(entryForm!.props.initialDate).toBeInstanceOf(Date);
  });

  it("passes existing entry data when found", async () => {
    const mockEntry = {
      id: 1,
      mood: 3,
      sleepQuality: 2,
      exercises: [],
    };
    getEntryMock.mockResolvedValue(mockEntry);

    const { default: DailyEntryPage } = await import("../app/entry/page");
    const tree = await DailyEntryPage();

    const nodes = flattenChildren(tree);
    const entryForm = nodes.find(
      (n) => (n as { type?: unknown }).type === EntryFormMock,
    ) as { props: Record<string, unknown> };

    expect(entryForm.props.entry).toEqual(mockEntry);
  });

  it("passes garmin sync timestamp when available", async () => {
    const syncDate = new Date("2026-04-24T06:00:00Z");
    getLatestGarminSyncMock.mockResolvedValue({
      createdAt: syncDate,
      status: "success",
    });

    const { default: DailyEntryPage } = await import("../app/entry/page");
    const tree = await DailyEntryPage();

    const nodes = flattenChildren(tree);
    const entryForm = nodes.find(
      (n) => (n as { type?: unknown }).type === EntryFormMock,
    ) as { props: Record<string, unknown> };

    expect(entryForm.props.garminSyncedAt).toEqual(syncDate);
  });

  it("fetches all data sources in parallel", async () => {
    let callOrder: string[] = [];
    getEntryMock.mockImplementation(() => {
      callOrder.push("entry");
      return Promise.resolve(null);
    });
    getActivityTypesMock.mockImplementation(() => {
      callOrder.push("activities");
      return Promise.resolve([]);
    });
    getLatestGarminSyncMock.mockImplementation(() => {
      callOrder.push("garmin");
      return Promise.resolve(null);
    });

    const { default: DailyEntryPage } = await import("../app/entry/page");
    await DailyEntryPage();

    // All three should be called (Promise.all)
    expect(callOrder).toContain("entry");
    expect(callOrder).toContain("activities");
    expect(callOrder).toContain("garmin");
  });
});
