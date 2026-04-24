import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findFirstMock = vi.fn();
const formatDistanceMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    garminSync: {
      findFirst: findFirstMock,
    },
  },
}));

vi.mock("@/components/nav", () => ({
  default: (props: Record<string, unknown>) => ({ type: "Nav", props }),
}));

vi.mock("sonner", () => ({
  Toaster: (props: Record<string, unknown>) => ({ type: "Toaster", props }),
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
}));

vi.mock("date-fns", () => ({
  formatDistanceToNowStrict: formatDistanceMock,
}));

function flattenChildren(element: unknown): unknown[] {
  if (element == null || typeof element === "boolean") return [];
  if (typeof element === "string" || typeof element === "number") return [element];
  if (Array.isArray(element)) return element.flatMap(flattenChildren);

  const el = element as { type?: unknown; props?: Record<string, unknown> };

  // If the element's type is a function component, call it to get rendered output
  if (typeof el.type === "function" && el.props) {
    try {
      const rendered = (el.type as (props: Record<string, unknown>) => unknown)(el.props);
      return [element, ...flattenChildren(rendered)];
    } catch {
      // If calling fails, fall through to normal handling
    }
  }

  if (el.props?.children != null) {
    return [element, ...flattenChildren(el.props.children)];
  }

  return [element];
}

function findByStringType(tree: unknown, typeName: string): unknown[] {
  return flattenChildren(tree).filter((node) => {
    const el = node as { type?: unknown };
    return el.type === typeName;
  });
}

describe("RootLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Nav with garminSync when authenticated", async () => {
    authMock.mockResolvedValueOnce({ user: { name: "James" } });
    findFirstMock.mockResolvedValueOnce({
      status: "success",
      createdAt: new Date("2025-01-01"),
    });
    formatDistanceMock.mockReturnValueOnce("3h");

    const { default: RootLayout } = await import("../app/layout");
    const tree = await RootLayout({ children: "test-child" });

    const navNodes = findByStringType(tree, "Nav");
    expect(navNodes.length).toBe(1);

    const navProps = (navNodes[0] as { props: Record<string, unknown> }).props;
    expect(navProps.garminSync).toEqual({ status: "good", syncAge: "3h" });
  });

  it("wraps children in flex layout with sidebar offset when authenticated", async () => {
    authMock.mockResolvedValueOnce({ user: { name: "James" } });
    findFirstMock.mockResolvedValueOnce({
      status: "success",
      createdAt: new Date("2025-01-01"),
    });
    formatDistanceMock.mockReturnValueOnce("3h");

    const { default: RootLayout } = await import("../app/layout");
    const tree = await RootLayout({ children: "test-child" });

    const allNodes = flattenChildren(tree);
    const flexDiv = allNodes.find((node) => {
      const el = node as { type?: string; props?: Record<string, unknown> };
      return (
        el.type === "div" &&
        typeof el.props?.className === "string" &&
        el.props.className.includes("flex") &&
        el.props.className.includes("min-h-screen")
      );
    });
    expect(flexDiv).toBeDefined();

    const mainEl = allNodes.find((node) => {
      const el = node as { type?: string; props?: Record<string, unknown> };
      return (
        el.type === "main" &&
        typeof el.props?.className === "string" &&
        el.props.className.includes("md:ml-64")
      );
    });
    expect(mainEl).toBeDefined();
  });

  it("renders children directly without Nav when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: RootLayout } = await import("../app/layout");
    const tree = await RootLayout({ children: "test-child" });

    const navNodes = findByStringType(tree, "Nav");
    expect(navNodes.length).toBe(0);

    const allNodes = flattenChildren(tree);
    const flexDiv = allNodes.find((node) => {
      const el = node as { type?: string; props?: Record<string, unknown> };
      return (
        el.type === "div" &&
        typeof el.props?.className === "string" &&
        el.props.className.includes("min-h-screen")
      );
    });
    expect(flexDiv).toBeUndefined();

    expect(allNodes).toContain("test-child");
  });

  it("does not query Garmin sync when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: RootLayout } = await import("../app/layout");
    await RootLayout({ children: "test-child" });

    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it("renders Toaster in both authenticated and unauthenticated states", async () => {
    // Authenticated
    authMock.mockResolvedValueOnce({ user: { name: "James" } });
    findFirstMock.mockResolvedValueOnce(null);

    const { default: RootLayout } = await import("../app/layout");
    const authTree = await RootLayout({ children: "test-child" });

    const authToasters = findByStringType(authTree, "Toaster");
    expect(authToasters.length).toBe(1);

    // Unauthenticated
    authMock.mockResolvedValueOnce(null);
    const unauthTree = await RootLayout({ children: "test-child" });

    const unauthToasters = findByStringType(unauthTree, "Toaster");
    expect(unauthToasters.length).toBe(1);
  });

  it("exports correct metadata", async () => {
    const { metadata } = await import("../app/layout");
    expect(metadata.title).toBe("Health Hub");
    expect(metadata.description).toBe("Personal health metrics tracker");
  });

  it("maps Garmin sync status 'success' to 'good'", async () => {
    authMock.mockResolvedValueOnce({ user: { name: "James" } });
    findFirstMock.mockResolvedValueOnce({
      status: "success",
      createdAt: new Date("2025-01-01"),
    });
    formatDistanceMock.mockReturnValueOnce("1h");

    const { default: RootLayout } = await import("../app/layout");
    const tree = await RootLayout({ children: "child" });

    const navNode = findByStringType(tree, "Nav")[0] as {
      props: { garminSync: { status: string } };
    };
    expect(navNode.props.garminSync.status).toBe("good");
  });

  it("maps Garmin sync status 'failed' to 'failed'", async () => {
    authMock.mockResolvedValueOnce({ user: { name: "James" } });
    findFirstMock.mockResolvedValueOnce({
      status: "failed",
      createdAt: new Date("2025-01-01"),
    });
    formatDistanceMock.mockReturnValueOnce("5h");

    const { default: RootLayout } = await import("../app/layout");
    const tree = await RootLayout({ children: "child" });

    const navNode = findByStringType(tree, "Nav")[0] as {
      props: { garminSync: { status: string } };
    };
    expect(navNode.props.garminSync.status).toBe("failed");
  });

  it("returns unknown status when no Garmin sync records exist", async () => {
    authMock.mockResolvedValueOnce({ user: { name: "James" } });
    findFirstMock.mockResolvedValueOnce(null);

    const { default: RootLayout } = await import("../app/layout");
    const tree = await RootLayout({ children: "child" });

    const navNode = findByStringType(tree, "Nav")[0] as {
      props: { garminSync: { status: string; syncAge: string | null } };
    };
    expect(navNode.props.garminSync.status).toBe("unknown");
    expect(navNode.props.garminSync.syncAge).toBeNull();
  });

  it("returns unknown status on database error", async () => {
    authMock.mockResolvedValueOnce({ user: { name: "James" } });
    findFirstMock.mockRejectedValueOnce(new Error("DB connection failed"));

    const { default: RootLayout } = await import("../app/layout");
    const tree = await RootLayout({ children: "child" });

    const navNode = findByStringType(tree, "Nav")[0] as {
      props: { garminSync: { status: string; syncAge: string | null } };
    };
    expect(navNode.props.garminSync.status).toBe("unknown");
    expect(navNode.props.garminSync.syncAge).toBeNull();
  });
});
