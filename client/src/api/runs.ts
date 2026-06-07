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

// Relative path — Vite's dev proxy forwards /api to the Express server.
const BASE = "/api/runs";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function buildRunsQuery(filters?: RunFilters): string {
  if (!filters) return "";
  const qs = new URLSearchParams();
  if (filters.from) qs.set("from", filters.from);
  if (filters.to) qs.set("to", filters.to);
  if (filters.minDistanceKm !== undefined)
    qs.set("minDistanceKm", String(filters.minDistanceKm));
  if (filters.maxDistanceKm !== undefined)
    qs.set("maxDistanceKm", String(filters.maxDistanceKm));
  if (filters.type && filters.type.length)
    qs.set("type", filters.type.join(","));
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

export async function fetchRuns(filters?: RunFilters): Promise<Run[]> {
  return handle<Run[]>(await fetch(`${BASE}${buildRunsQuery(filters)}`));
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
