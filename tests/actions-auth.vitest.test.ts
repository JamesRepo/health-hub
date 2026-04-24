import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class AuthError extends Error {}

class RedirectError extends Error {
  constructor(readonly destination: string) {
    super(`Redirected to ${destination}`);
  }
}

const redirectMock = vi.fn((destination: string) => {
  throw new RedirectError(destination);
});
const signInMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next-auth", () => ({
  AuthError,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth", () => ({
  signIn: signInMock,
  signOut: signOutMock,
}));

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    signInMock.mockReset();
    signOutMock.mockReset();
  });

  it("signs in with the submitted password and safe callback URL", async () => {
    const { login } = await import("../actions/auth");
    const formData = new FormData();

    formData.set("password", "secret");
    formData.set("callbackUrl", "/history?view=month");

    await login(formData);

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      password: "secret",
      redirectTo: "/history?view=month",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("falls back to the home page when no callback URL is supplied", async () => {
    const { login } = await import("../actions/auth");
    const formData = new FormData();

    formData.set("password", "secret");

    await login(formData);

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      password: "secret",
      redirectTo: "/",
    });
  });

  it("redirects to the missing-password error when validation fails", async () => {
    const { login } = await import("../actions/auth");
    const formData = new FormData();

    await expect(login(formData)).rejects.toEqual(
      expect.objectContaining({
        destination: "/login?error=missing_password",
      }),
    );

    expect(signInMock).not.toHaveBeenCalled();
  });

  it("preserves the callback URL when password validation fails", async () => {
    const { login } = await import("../actions/auth");
    const formData = new FormData();

    formData.set("callbackUrl", "/history?view=month");

    await expect(login(formData)).rejects.toEqual(
      expect.objectContaining({
        destination:
          "/login?error=missing_password&callbackUrl=%2Fhistory%3Fview%3Dmonth",
      }),
    );

    expect(signInMock).not.toHaveBeenCalled();
  });

  it("rejects unsafe callback URLs before calling signIn", async () => {
    const { login } = await import("../actions/auth");
    const formData = new FormData();

    formData.set("password", "secret");
    formData.set("callbackUrl", "https://example.com/evil");

    await expect(login(formData)).rejects.toEqual(
      expect.objectContaining({
        destination: "/login?error=invalid_callback",
      }),
    );

    expect(signInMock).not.toHaveBeenCalled();
  });

  it("redirects to the invalid-password error when NextAuth rejects credentials", async () => {
    const { login } = await import("../actions/auth");
    const formData = new FormData();

    signInMock.mockRejectedValueOnce(new AuthError("Invalid login"));
    formData.set("password", "wrong-password");

    await expect(login(formData)).rejects.toEqual(
      expect.objectContaining({
        destination: "/login?error=invalid_password",
      }),
    );
  });

  it("preserves the callback URL when credentials are rejected", async () => {
    const { login } = await import("../actions/auth");
    const formData = new FormData();

    signInMock.mockRejectedValueOnce(new AuthError("Invalid login"));
    formData.set("password", "wrong-password");
    formData.set("callbackUrl", "/history?view=month");

    await expect(login(formData)).rejects.toEqual(
      expect.objectContaining({
        destination:
          "/login?error=invalid_password&callbackUrl=%2Fhistory%3Fview%3Dmonth",
      }),
    );
  });

  it("signs out back to the login page", async () => {
    const { logout } = await import("../actions/auth");

    await logout();

    expect(signOutMock).toHaveBeenCalledWith({
      redirectTo: "/login",
    });
  });
});
