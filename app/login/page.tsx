import { redirect } from "next/navigation";

import { login } from "@/actions/auth";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_password: "Incorrect password.",
  invalid_callback: "Invalid return path. Sign in again from the page you want to open.",
  missing_password: "Enter your password to continue.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  const params = (await searchParams) ?? {};
  const callbackUrl = params.callbackUrl;
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-10">
      <Card className="w-full max-w-sm border-[#222222] bg-[#111111] text-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">❤️‍🩹 Health Hub</CardTitle>
          <CardDescription>
            Enter your password to access your health data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <input
              type="hidden"
              name="callbackUrl"
              value={callbackUrl ?? "/"}
            />
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {errorMessage ? (
              <p className="text-sm text-red-500">{errorMessage}</p>
            ) : null}
            <Button className="w-full bg-[#22c55e] text-white hover:bg-[#16a34a]" type="submit">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
