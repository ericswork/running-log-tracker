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

// Relative path — Vite's dev proxy forwards /api to the Express server.
const BASE = "/api/runs";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

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

export async function fetchRuns(): Promise<Run[]> {
  return handle<Run[]>(await fetch(BASE));
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
