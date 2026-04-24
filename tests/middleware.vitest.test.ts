import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: (handler: (request: unknown) => Response) => handler,
}));

function createRequest(path: string, auth: unknown = null) {
  const url = new URL(path, "https://health-hub.local");

  return {
    auth,
    nextUrl: url,
    url: url.toString(),
  };
}

const event = {} as never;

function requireResponse(response: Response | void) {
  expect(response).toBeInstanceOf(Response);

  if (!(response instanceof Response)) {
    throw new Error("Expected middleware to return a Response");
  }

  return response;
}

describe("auth middleware", () => {
  it("redirects unauthenticated protected routes to login with a callback URL", async () => {
    const { default: middleware } = await import("../middleware");
    const response = requireResponse(
      await middleware(createRequest("/history?view=month") as never, event),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://health-hub.local/login?callbackUrl=%2Fhistory%3Fview%3Dmonth",
    );
  });

  it("redirects unauthenticated home requests to login without a callback URL", async () => {
    const { default: middleware } = await import("../middleware");
    const response = requireResponse(await middleware(createRequest("/") as never, event));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://health-hub.local/login");
  });

  it("allows unauthenticated access to the login page and auth routes", async () => {
    const { default: middleware } = await import("../middleware");
    const loginResponse = requireResponse(
      await middleware(createRequest("/login") as never, event),
    );
    const apiResponse = requireResponse(
      await middleware(createRequest("/api/auth/session") as never, event),
    );

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers.get("location")).toBeNull();
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.headers.get("location")).toBeNull();
  });

  it("redirects authenticated users away from the login page", async () => {
    const { default: middleware } = await import("../middleware");
    const response = requireResponse(
      await middleware(createRequest("/login", { user: { name: "James" } }) as never, event),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://health-hub.local/");
  });

  it("keeps the matcher scoped away from static assets and Next internals", async () => {
    const { config } = await import("../middleware");

    expect(config).toEqual({
      matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
    });
  });
});
