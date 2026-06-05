// The single source of truth for allowed run types. Used by the zod schemas
// (and available to the frontend select) so validation can never drift from
// what the UI offers.
export const RUN_TYPES = [
  "Easy",
  "Recovery",
  "Tempo",
  "Interval",
  "Long Run",
  "Race",
] as const;

export type RunType = (typeof RUN_TYPES)[number];

export const DEFAULT_RUN_TYPE: RunType = "Easy";
