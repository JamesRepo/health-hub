import { beforeEach, describe, expect, it, vi } from "vitest";

class RedirectError extends Error {
  constructor(readonly destination: string) {
    super(`Redirected to ${destination}`);
  }
}

const redirectMock = vi.fn((destination: string) => {
  throw new RedirectError(destination);
});
const authMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/actions/auth", () => ({
  login: vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: (props: Record<string, unknown>) => props,
}));

vi.mock("@/components/ui/card", () => ({
  Card: (props: Record<string, unknown>) => props,
  CardContent: (props: Record<string, unknown>) => props,
  CardDescription: (props: Record<string, unknown>) => props,
  CardHeader: (props: Record<string, unknown>) => props,
  CardTitle: (props: Record<string, unknown>) => props,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: Record<string, unknown>) => props,
}));

vi.mock("@/components/ui/label", () => ({
  Label: (props: Record<string, unknown>) => props,
}));

function flattenChildren(element: unknown): unknown[] {
  if (element == null || typeof element === "boolean") return [];
  if (typeof element === "string" || typeof element === "number") return [element];
  if (Array.isArray(element)) return element.flatMap(flattenChildren);

  const el = element as { props?: { children?: unknown } };
  if (el.props?.children != null) {
    return [element, ...flattenChildren(el.props.children)];
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

describe("login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects authenticated users to the home page", async () => {
    authMock.mockResolvedValueOnce({ user: { name: "James" } });

    const { default: LoginPage } = await import("../app/login/page");

    await expect(LoginPage({ searchParams: Promise.resolve({}) })).rejects.toEqual(
      expect.objectContaining({ destination: "/" }),
    );
  });

  it("renders the login form for unauthenticated users", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({ searchParams: Promise.resolve({}) });

    expect(redirectMock).not.toHaveBeenCalled();

    const forms = findByType(tree, "form");
    expect(forms.length).toBe(1);

    const passwordInputs = findByProp(tree, "type", "password");
    expect(passwordInputs.length).toBe(1);
    expect((passwordInputs[0] as { props: Record<string, unknown> }).props.name).toBe("password");
  });

  it("displays the app name with health emoji", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({ searchParams: Promise.resolve({}) });

    const allNodes = flattenChildren(tree);
    const hasHealthHub = allNodes.some(
      (node) => typeof node === "string" && node.includes("Health Hub"),
    );
    expect(hasHealthHub).toBe(true);
  });

  it("applies green accent styling to the submit button", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({ searchParams: Promise.resolve({}) });

    const buttons = findByProp(tree, "type", "submit");
    expect(buttons.length).toBe(1);

    const buttonClassName = (buttons[0] as { props: Record<string, unknown> }).props
      .className as string;
    expect(buttonClassName).toContain("bg-[#22c55e]");
  });

  it("sets the hidden callbackUrl from search params", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({
      searchParams: Promise.resolve({ callbackUrl: "/history?view=month" }),
    });

    const hiddenInputs = findByProp(tree, "type", "hidden");
    expect(hiddenInputs.length).toBe(1);

    const hiddenInput = hiddenInputs[0] as { props: Record<string, unknown> };
    expect(hiddenInput.props.name).toBe("callbackUrl");
    expect(hiddenInput.props.value).toBe("/history?view=month");
  });

  it("defaults the hidden callbackUrl to / when none is provided", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({ searchParams: Promise.resolve({}) });

    const hiddenInputs = findByProp(tree, "type", "hidden");
    const hiddenInput = hiddenInputs[0] as { props: Record<string, unknown> };
    expect(hiddenInput.props.value).toBe("/");
  });

  it("shows the error message for an invalid password", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({
      searchParams: Promise.resolve({ error: "invalid_password" }),
    });

    const allNodes = flattenChildren(tree);
    const hasError = allNodes.some(
      (node) => typeof node === "string" && node.includes("Incorrect password"),
    );
    expect(hasError).toBe(true);
  });

  it("shows the error message for a missing password", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({
      searchParams: Promise.resolve({ error: "missing_password" }),
    });

    const allNodes = flattenChildren(tree);
    const hasError = allNodes.some(
      (node) => typeof node === "string" && node.includes("Enter your password"),
    );
    expect(hasError).toBe(true);
  });

  it("shows the error message for an invalid callback URL", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({
      searchParams: Promise.resolve({ error: "invalid_callback" }),
    });

    const allNodes = flattenChildren(tree);
    const hasError = allNodes.some(
      (node) => typeof node === "string" && node.includes("Invalid return path"),
    );
    expect(hasError).toBe(true);
  });

  it("does not show an error message when no error param is present", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({ searchParams: Promise.resolve({}) });

    const errorNodes = findByProp(tree, "className", "text-sm text-red-500");
    expect(errorNodes.length).toBe(0);
  });

  it("handles missing searchParams gracefully", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: LoginPage } = await import("../app/login/page");
    const tree = await LoginPage({});

    const forms = findByType(tree, "form");
    expect(forms.length).toBe(1);

    const hiddenInputs = findByProp(tree, "type", "hidden");
    const hiddenInput = hiddenInputs[0] as { props: Record<string, unknown> };
    expect(hiddenInput.props.value).toBe("/");
  });
});
