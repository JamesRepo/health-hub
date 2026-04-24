"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/lib/auth";

const loginSchema = z.object({
  password: z.string().min(1),
  callbackUrl: z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || (value.startsWith("/") && !value.startsWith("//")),
      "Invalid callback URL"
    ),
});

function buildLoginRedirect(error: "invalid_callback" | "invalid_password" | "missing_password", callbackUrl?: string) {
  const params = new URLSearchParams({
    error,
  });

  if (callbackUrl) {
    params.set("callbackUrl", callbackUrl);
  }

  return `/login?${params.toString()}`;
}

export async function login(formData: FormData) {
  const rawCallbackUrl = formData.get("callbackUrl");
  const callbackUrl =
    typeof rawCallbackUrl === "string" && rawCallbackUrl.length > 0
      ? rawCallbackUrl
      : undefined;
  const parsedInput = loginSchema.safeParse({
    password: formData.get("password"),
    callbackUrl,
  });

  if (!parsedInput.success) {
    const hasPasswordError = parsedInput.error.issues.some(
      (issue) => issue.path[0] === "password",
    );
    const hasCallbackUrlError = parsedInput.error.issues.some(
      (issue) => issue.path[0] === "callbackUrl",
    );

    redirect(
      buildLoginRedirect(
        hasPasswordError ? "missing_password" : "invalid_callback",
        hasCallbackUrlError ? undefined : callbackUrl,
      ),
    );
  }

  try {
    await signIn("credentials", {
      password: parsedInput.data.password,
      redirectTo: parsedInput.data.callbackUrl ?? "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(
        buildLoginRedirect("invalid_password", parsedInput.data.callbackUrl),
      );
    }

    throw error;
  }
}

export async function logout() {
  await signOut({
    redirectTo: "/login",
  });
}
