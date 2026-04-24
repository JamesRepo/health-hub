import { NextResponse } from "next/server";

export function notImplementedRoute(routeName: string) {
  return NextResponse.json(
    {
      error: `${routeName} is not implemented yet.`,
    },
    {
      status: 501,
    },
  );
}
