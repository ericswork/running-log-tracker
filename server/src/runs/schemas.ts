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
