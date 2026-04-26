import { beforeEach, describe, expect, it, vi } from "vitest";

class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
  }
}

const getEntryMock = vi.fn();
const getActivityTypesMock = vi.fn();
const getLatestGarminSyncMock = vi.fn();
const EntryFormMock = vi.fn((props: Record<string, unknown>) => props);

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundError();
  },
}));

vi.mock("@/lib/daily-log", () => ({
  getEntry: getEntryMock,
  getActivityTypes: getActivityTypesMock,
  getLatestGarminSync: getLatestGarminSyncMock,
}));

vi.mock("@/components/entry-form", () => ({
  EntryForm: EntryFormMock,
}));

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

describe("entry date page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEntryMock.mockResolvedValue(null);
    getActivityTypesMock.mockResolvedValue([]);
    getLatestGarminSyncMock.mockResolvedValue(null);
  });

  it("renders EntryForm with the parsed date", async () => {
    const { default: EntryDatePage } = await import(
      "../app/entry/[date]/page"
    );

    const tree = await EntryDatePage({
      params: Promise.resolve({ date: "2026-04-20" }),
    });

    const nodes = flattenChildren(tree);
    const entryForm = nodes.find(
      (n) => (n as { type?: unknown }).type === EntryFormMock,
    ) as { props: Record<string, unknown> };

    expect(entryForm).toBeDefined();

    const initialDate = entryForm.props.initialDate as Date;
    expect(initialDate.getFullYear()).toBe(2026);
    expect(initialDate.getMonth()).toBe(3); // April = 3
    expect(initialDate.getDate()).toBe(20);
  });

  it("calls notFound for an invalid date string", async () => {
    const { default: EntryDatePage } = await import(
      "../app/entry/[date]/page"
    );

    await expect(
      EntryDatePage({ params: Promise.resolve({ date: "not-a-date" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getEntryMock).not.toHaveBeenCalled();
  });

  it("calls notFound for a malformed date like 2026-13-99", async () => {
    const { default: EntryDatePage } = await import(
      "../app/entry/[date]/page"
    );

    await expect(
      EntryDatePage({ params: Promise.resolve({ date: "2026-13-99" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("fetches entry data for the specified date", async () => {
    const { default: EntryDatePage } = await import(
      "../app/entry/[date]/page"
    );

    await EntryDatePage({
      params: Promise.resolve({ date: "2026-03-15" }),
    });

    expect(getEntryMock).toHaveBeenCalledWith("2026-03-15");
  });

  it("passes existing entry and garmin data to EntryForm", async () => {
    const mockEntry = { id: 5, mood: 1, exercises: [] };
    const syncDate = new Date("2026-03-15T06:00:00Z");

    getEntryMock.mockResolvedValue(mockEntry);
    getLatestGarminSyncMock.mockResolvedValue({
      createdAt: syncDate,
      status: "success",
    });

    const { default: EntryDatePage } = await import(
      "../app/entry/[date]/page"
    );

    const tree = await EntryDatePage({
      params: Promise.resolve({ date: "2026-03-15" }),
    });

    const nodes = flattenChildren(tree);
    const entryForm = nodes.find(
      (n) => (n as { type?: unknown }).type === EntryFormMock,
    ) as { props: Record<string, unknown> };

    expect(entryForm.props.entry).toEqual(mockEntry);
    expect(entryForm.props.garminSyncedAt).toEqual(syncDate);
  });
});
