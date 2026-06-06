import { z } from "zod";
import { isValidTimeZone } from "./buckets";

// True for a real YYYY-MM-DD calendar date (rejects e.g. 2026-13-40).
function isRealCalendarDate(s: string): boolean {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be a YYYY-MM-DD date")
  .refine(isRealCalendarDate, "must be a valid calendar date");

// Shared query schema for every /api/stats endpoint. All params optional:
// `from`/`to` bound an inclusive date range (local calendar dates); `timezone`
// is an IANA name or fixed UTC offset (empty/absent → UTC, handled downstream).
export const statsQuerySchema = z
  .object({
    from: ymd.optional(),
    to: ymd.optional(),
    timezone: z
      .string()
      .refine(
        (tz) => tz === "" || isValidTimeZone(tz),
        "must be a valid IANA timezone name or UTC offset",
      )
      .optional(),
  })
  .refine((data) => !(data.from && data.to) || data.from <= data.to, {
    message: "from must not be after to",
    path: ["from"],
  });

export type StatsQuery = z.infer<typeof statsQuerySchema>;
