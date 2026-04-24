import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nextAuthMock = vi.fn();
const credentialsMock = vi.fn((config: object) => config);

vi.mock("next-auth", () => ({
  default: nextAuthMock,
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: credentialsMock,
}));

describe("lib/auth", () => {
  const originalAuthPassword = process.env.AUTH_PASSWORD;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    nextAuthMock.mockReturnValue({
      handlers: {
        GET: "GET_HANDLER",
        POST: "POST_HANDLER",
      },
      signIn: vi.fn(),
      signOut: vi.fn(),
      auth: vi.fn(),
    });
  });

  afterEach(() => {
    process.env.AUTH_PASSWORD = originalAuthPassword;
  });

  it("configures credentials auth with the expected login page and session settings", async () => {
    const authModule = await import("../lib/auth");
    const config = nextAuthMock.mock.calls[0]?.[0];

    expect(authModule.handlers.GET).toBe("GET_HANDLER");
    expect(authModule.handlers.POST).toBe("POST_HANDLER");
    expect(config.pages).toEqual({
      signIn: "/login",
    });
    expect(config.session).toEqual({
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60,
    });
    expect(credentialsMock).toHaveBeenCalledTimes(1);
    expect(config.providers).toHaveLength(1);
    expect(config.providers[0].credentials).toEqual({
      password: {
        label: "Password",
        type: "password",
      },
    });
  });

  it("authorizes only the configured password", async () => {
    process.env.AUTH_PASSWORD = "correct-horse";

    await import("../lib/auth");
    const config = nextAuthMock.mock.calls[0]?.[0];
    const authorize = config.providers[0].authorize as (
      credentials: unknown,
    ) => Promise<{ id: string; name: string } | null> | { id: string; name: string } | null;

    expect(await authorize({ password: "correct-horse" })).toEqual({
      id: "1",
      name: "James",
    });
    expect(await authorize({ password: "wrong" })).toBeNull();
    expect(await authorize({ password: "" })).toBeNull();
    expect(await authorize({})).toBeNull();
  });
});
