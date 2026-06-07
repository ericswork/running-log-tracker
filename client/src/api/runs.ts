// Client-side types for runs. Defined independently of the server (the design
// accepts minor duplication rather than a shared types package for Phase 1).
export const RUN_TYPES = [
  "Easy",
  "Recovery",
  "Tempo",
  "Interval",
  "Long Run",
  "Race",
] as const;

export type RunType = (typeof RUN_TYPES)[number];

export interface Run {
  id: string;
  distanceKm: number;
  durationSec: number;
  date: string; // ISO 8601, preserves time of day
  type: RunType;
  notes: string | null;
  createdAt: string;
}

export interface CreateRunPayload {
  distanceKm: number;
  durationSec: number;
  date: string; // ISO 8601
  type?: RunType; // omitted → server defaults to "Easy"
  notes?: string;
}

export type UpdateRunPayload = Partial<CreateRunPayload>;

// Parsed fields returned by the GPX import endpoint (no run is persisted).
export interface ImportedRun {
  distanceKm: number;
  durationSec?: number;
  date?: string; // ISO 8601
}

// Optional, AND-combined filters for the run list. `type` is the explicit set of
// run types to include; omit it (or pass all types) to include every type — the
// none-selected case is handled in the UI, not sent to the API.
export interface RunFilters {
  from?: string; // YYYY-MM-DD (inclusive, whole day)
  to?: string; // YYYY-MM-DD (inclusive, whole day)
  minDistanceKm?: number;
  maxDistanceKm?: number;
  type?: RunType[];
}

// Columns the list may be sorted by (server-side).
export type RunSortField = "date" | "distanceKm" | "durationSec" | "type";
export type SortOrder = "asc" | "desc";

// Filters plus optional pagination + sort. Omitted pagination/sort fall back to
// the server defaults (limit 20, offset 0, date desc).
export interface RunListParams extends RunFilters {
  limit?: number;
  offset?: number;
  sort?: RunSortField;
  order?: SortOrder;
}

// The paginated list response. `total` is the count of the full filtered set.
export interface RunsPage {
  runs: Run[];
  total: number;
  limit: number;
  offset: number;
}

// Relative path — Vite's dev proxy forwards /api to the Express server.
const BASE = "/api/runs";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function buildRunsQuery(params?: RunListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.minDistanceKm !== undefined)
    qs.set("minDistanceKm", String(params.minDistanceKm));
  if (params.maxDistanceKm !== undefined)
    qs.set("maxDistanceKm", String(params.maxDistanceKm));
  if (params.type && params.type.length) qs.set("type", params.type.join(","));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.offset !== undefined) qs.set("offset", String(params.offset));
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      detail = ` — ${JSON.stringify(await res.json())}`;
    } catch {
      // response had no JSON body
    }
    throw new Error(`Request failed (${res.status})${detail}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchRuns(params?: RunListParams): Promise<RunsPage> {
  return handle<RunsPage>(await fetch(`${BASE}${buildRunsQuery(params)}`));
}

export async function fetchRun(id: string): Promise<Run> {
  return handle<Run>(await fetch(`${BASE}/${id}`));
}

export async function createRun(payload: CreateRunPayload): Promise<Run> {
  return handle<Run>(
    await fetch(BASE, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    }),
  );
}

export async function updateRun(
  id: string,
  payload: UpdateRunPayload,
): Promise<Run> {
  return handle<Run>(
    await fetch(`${BASE}/${id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteRun(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`Delete failed (${res.status})`);
  }
}

// Upload a .gpx file for parsing. No Content-Type header — the browser sets the
// multipart boundary automatically for FormData.
export async function importGpx(file: File): Promise<ImportedRun> {
  const formData = new FormData();
  formData.append("file", file);
  return handle<ImportedRun>(
    await fetch(`${BASE}/import`, { method: "POST", body: formData }),
  );
}
