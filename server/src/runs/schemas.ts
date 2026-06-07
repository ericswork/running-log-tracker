import { z } from "zod";
import { RUN_TYPES, DEFAULT_RUN_TYPE } from "./constants";

// Shared field rules. `date` accepts an ISO 8601 string (or Date) and coerces
// to a Date, preserving the submitted time of day — it is NOT normalized to
// midnight. Invalid dates fail coercion.
const runFields = {
  distanceKm: z.number().positive("distanceKm must be a positive number"),
  durationSec: z
    .number()
    .int("durationSec must be an integer")
    .positive("durationSec must be a positive number"),
  date: z.coerce.date({ error: "date must be a valid ISO 8601 date-time" }),
  type: z.enum(RUN_TYPES),
  notes: z.string().trim().optional(),
};

// Create: all core fields required; run type defaults to Easy when omitted.
export const createRunSchema = z.object({
  ...runFields,
  type: z.enum(RUN_TYPES).default(DEFAULT_RUN_TYPE),
});

// Update: same per-field rules, but any subset may be provided (PATCH-style).
export const updateRunSchema = z.object(runFields).partial();

export type CreateRunInput = z.infer<typeof createRunSchema>;
export type UpdateRunInput = z.infer<typeof updateRunSchema>;

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

// `type` may arrive repeatable (?type=Easy&type=Tempo → array) or comma-separated
// (?type=Easy,Tempo → string). Normalize to a string[] of RUN_TYPES; an absent or
// empty selection means "no type filter" (all types) — the UI guards the
// none-selected case client-side.
const typeFilter = z.preprocess((val) => {
  if (val === undefined || val === null) return undefined;
  const arr = Array.isArray(val) ? val : String(val).split(",");
  const cleaned = arr.map((s) => String(s).trim()).filter((s) => s.length > 0);
  return cleaned.length ? cleaned : undefined;
}, z.array(z.enum(RUN_TYPES)).optional());

// Optional filters for GET /api/runs, all AND-combined. from/to are whole-day
// inclusive bounds against the raw stored timestamp (no timezone). Distances are
// coerced from query strings. Inverted ranges are rejected.
export const listRunsQuerySchema = z
  .object({
    from: ymd.optional(),
    to: ymd.optional(),
    minDistanceKm: z.coerce
      .number()
      .nonnegative("minDistanceKm must be a non-negative number")
      .optional(),
    maxDistanceKm: z.coerce
      .number()
      .nonnegative("maxDistanceKm must be a non-negative number")
      .optional(),
    type: typeFilter,
  })
  .refine((d) => !(d.from && d.to) || d.from <= d.to, {
    message: "from must not be after to",
    path: ["from"],
  })
  .refine(
    (d) =>
      !(d.minDistanceKm !== undefined && d.maxDistanceKm !== undefined) ||
      d.minDistanceKm <= d.maxDistanceKm,
    {
      message: "minDistanceKm must not exceed maxDistanceKm",
      path: ["minDistanceKm"],
    },
  );

export type ListRunsQuery = z.infer<typeof listRunsQuerySchema>;
