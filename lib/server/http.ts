import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "private, no-store", ...init?.headers },
  });
}

export function zodMessage(error: ZodError) {
  const issue = error.issues[0];
  return issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request";
}

export function handleError(error: unknown) {
  unstable_rethrow(error);
  if (error instanceof HttpError) {
    return json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  console.error(error);
  return json(
    { error: { code: "internal_error", message: "Something went wrong" } },
    { status: 500 },
  );
}

export function isUniqueViolation(error: unknown) {
  const cause = (error as { cause?: { code?: string } })?.cause;
  return (error as { code?: string })?.code === "23505" || cause?.code === "23505";
}

export async function cookieDefaults(maxAgeDays: number) {
  const proto = (await headers()).get("x-forwarded-proto");
  return {
    sameSite: "lax" as const,
    secure: proto?.split(",")[0]?.trim() === "https",
    path: "/",
    maxAge: 60 * 60 * 24 * maxAgeDays,
  };
}
