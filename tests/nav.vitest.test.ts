import { beforeEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("next/link", () => ({
  default: (props: Record<string, unknown>) => props,
}));

vi.mock("lucide-react", () => ({
  Home: (props: Record<string, unknown>) => props,
  PlusCircle: (props: Record<string, unknown>) => props,
  Calendar: (props: Record<string, unknown>) => props,
  BarChart3: (props: Record<string, unknown>) => props,
  Brain: (props: Record<string, unknown>) => props,
  Settings: (props: Record<string, unknown>) => props,
  LogOut: (props: Record<string, unknown>) => props,
}));

vi.mock("@/actions/auth", () => ({
  logout: logoutMock,
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

  // Handle mock components that return props directly (children at top level)
  const obj = element as Record<string, unknown>;
  if (obj.children != null && !obj.props) {
    return [element, ...flattenChildren(obj.children)];
  }

  return [element];
}

function findByType(tree: unknown, typeName: string): unknown[] {
  return flattenChildren(tree).filter((node) => {
    const el = node as { type?: unknown };
    if (typeof el.type === "string") return el.type === typeName;
    if (typeof el.type === "function") return el.type.name === typeName;
    return false;
  });
}

function findByProp(tree: unknown, prop: string, value: unknown): unknown[] {
  return flattenChildren(tree).filter((node) => {
    const el = node as { props?: Record<string, unknown> };
    return el.props?.[prop] === value;
  });
}

/** Find nodes that have an href prop (Link mock returns props directly) */
function findLinks(tree: unknown): { href: string; className: string; children: unknown }[] {
  return flattenChildren(tree)
    .filter((node) => {
      const el = node as { href?: string };
      return typeof el.href === "string";
    })
    .map((node) => {
      const el = node as Record<string, unknown>;
      return {
        href: el.href as string,
        className: (el.className as string) ?? "",
        children: el.children,
      };
    });
}

function allText(tree: unknown): string {
  const nodes = flattenChildren(tree);
  return nodes
    .filter((n) => typeof n === "string" || typeof n === "number")
    .join(" ");
}

describe("Nav component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/");
  });

  async function renderNav(
    garminSync: import("../components/nav").GarminSyncInfo = { status: "good", syncAge: "2h" },
    pathname = "/",
  ) {
    usePathnameMock.mockReturnValue(pathname);
    const { default: Nav } = await import("../components/nav");
    return Nav({ garminSync });
  }

  it("renders all 5 main nav items with correct hrefs", async () => {
    const tree = await renderNav();
    const links = findLinks(tree);

    const expected = [
      { href: "/", label: "Dashboard" },
      { href: "/entry", label: "Log Entry" },
      { href: "/history", label: "History" },
      { href: "/analytics", label: "Analytics" },
      { href: "/insights", label: "Insights" },
    ];

    for (const { href, label } of expected) {
      const matching = links.filter((l) => l.href === href);
      expect(matching.length).toBeGreaterThanOrEqual(1);
      const text = allText(matching[0].children);
      expect(text).toContain(label);
    }
  });

  it("renders Admin link pointing to /admin", async () => {
    const tree = await renderNav();
    const links = findLinks(tree);
    const adminLinks = links.filter((l) => l.href === "/admin");
    expect(adminLinks.length).toBeGreaterThanOrEqual(1);
    expect(allText(adminLinks[0].children)).toContain("Admin");
  });

  it("renders sign out button with type=submit inside a form", async () => {
    const tree = await renderNav();
    const forms = findByType(tree, "form");
    expect(forms.length).toBeGreaterThanOrEqual(1);

    const submitButtons = findByProp(tree, "type", "submit");
    expect(submitButtons.length).toBeGreaterThanOrEqual(1);

    const buttonText = allText(submitButtons[0]);
    expect(buttonText).toContain("Sign out");
  });

  it("renders the Health Hub logo text", async () => {
    const tree = await renderNav();
    const text = allText(tree);
    expect(text).toContain("Health Hub");
  });

  it("applies active class on exact match for /", async () => {
    const tree = await renderNav({ status: "good", syncAge: "2h" }, "/");
    const links = findLinks(tree);
    const dashboardLinks = links.filter((l) => l.href === "/");
    const activeLink = dashboardLinks.find((l) => l.className.includes("text-[#22c55e]"));
    expect(activeLink).toBeDefined();
  });

  it("applies active class on nested route", async () => {
    const tree = await renderNav({ status: "good", syncAge: "2h" }, "/analytics/alcohol");
    const links = findLinks(tree);
    const analyticsLinks = links.filter((l) => l.href === "/analytics");
    const activeLink = analyticsLinks.find((l) => l.className.includes("text-[#22c55e]"));
    expect(activeLink).toBeDefined();
  });

  it("only one nav item is active at a time", async () => {
    const tree = await renderNav({ status: "good", syncAge: "2h" }, "/entry");
    const links = findLinks(tree);

    const mainHrefs = ["/", "/entry", "/history", "/analytics", "/insights"];
    const mainLinks = links.filter((l) => mainHrefs.includes(l.href));

    // /entry links should be active, others inactive
    const activeLinks = mainLinks.filter((l) => l.className.includes("text-[#22c55e]"));
    const inactiveLinks = mainLinks.filter(
      (l) => l.className.includes("text-[#a3a3a3]") || l.className.includes("text-[#737373]"),
    );

    expect(activeLinks.every((l) => l.href === "/entry")).toBe(true);
    expect(inactiveLinks.length).toBeGreaterThan(0);
  });

  it("shows synced text and green dot for good status", async () => {
    const tree = await renderNav({ status: "good", syncAge: "2h" });
    const text = allText(tree);
    expect(text).toContain("synced");

    const allNodes = flattenChildren(tree);
    const greenDot = allNodes.find((node) => {
      const el = node as { props?: Record<string, unknown>; className?: string };
      const cn = el.props?.className ?? el.className;
      return typeof cn === "string" && cn.includes("bg-[#22c55e]");
    });
    expect(greenDot).toBeDefined();
  });

  it("shows failed text and red dot for failed status", async () => {
    const tree = await renderNav({ status: "failed", syncAge: "5h" });
    const text = allText(tree);
    expect(text).toContain("failed");

    const allNodes = flattenChildren(tree);
    const redDot = allNodes.find((node) => {
      const el = node as { props?: Record<string, unknown>; className?: string };
      const cn = el.props?.className ?? el.className;
      return typeof cn === "string" && cn.includes("bg-[#ef4444]");
    });
    expect(redDot).toBeDefined();
  });

  it("shows no data text for unknown status", async () => {
    const tree = await renderNav({ status: "unknown", syncAge: null });
    const text = allText(tree);
    expect(text).toContain("no data");
  });

  it("renders 5 mobile tab bar items with mobile labels", async () => {
    const tree = await renderNav();
    const allNodes = flattenChildren(tree);

    // Find the mobile nav element
    const mobileNav = allNodes.find((node) => {
      const el = node as { type?: string };
      return el.type === "nav";
    });
    expect(mobileNav).toBeDefined();

    const text = allText(tree);
    const mobileLabels = ["Dashboard", "Log", "History", "Analytics", "Insights"];
    for (const label of mobileLabels) {
      expect(text).toContain(label);
    }

    // Mobile tab bar links
    const mobileNavChildren = flattenChildren(mobileNav);
    const mobileLinks = mobileNavChildren.filter((node) => {
      const el = node as { href?: string };
      return typeof el.href === "string";
    });
    expect(mobileLinks.length).toBe(5);
  });

  it("shows mobile sync pill when status is not unknown", async () => {
    const tree = await renderNav({ status: "good", syncAge: "2h" });
    const allNodes = flattenChildren(tree);

    const header = allNodes.find((node) => {
      const el = node as { type?: string };
      return el.type === "header";
    });
    expect(header).toBeDefined();

    const headerChildren = flattenChildren(header);
    const syncPill = headerChildren.find((node) => {
      const el = node as { props?: Record<string, unknown> };
      return typeof el.props?.className === "string" && el.props.className.includes("rounded-full");
    });
    expect(syncPill).toBeDefined();
  });

  it("hides mobile sync pill when status is unknown", async () => {
    const tree = await renderNav({ status: "unknown", syncAge: null });
    const allNodes = flattenChildren(tree);

    const header = allNodes.find((node) => {
      const el = node as { type?: string };
      return el.type === "header";
    });
    expect(header).toBeDefined();

    const headerChildren = flattenChildren(header);
    const syncPill = headerChildren.find((node) => {
      const el = node as { props?: Record<string, unknown> };
      return typeof el.props?.className === "string" && el.props.className.includes("rounded-full");
    });
    expect(syncPill).toBeUndefined();
  });
});
