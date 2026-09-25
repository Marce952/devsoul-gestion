import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export function isAuthorizedCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(req.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
