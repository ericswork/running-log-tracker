// Display formatting + pace derivation for the dashboard. The server returns
// only canonical units (distanceKm, durationSec); everything here is the
// client's responsibility. Kept pure and side-effect-free so it is unit-testable.

// Average pace in seconds per kilometer, or null when distance is zero (pace is
// undefined). Callers render null as a gap / em dash rather than a 0 pace.
export function avgPaceSecPerKm(
  distanceKm: number,
  durationSec: number,
): number | null {
  if (distanceKm <= 0) return null;
  return durationSec / distanceKm;
}

// "m:ss /km", or "—" when pace is undefined. Accepts the nullable output of
// avgPaceSecPerKm directly.
export function formatPace(secPerKm: number | null): string {
  if (secPerKm === null || !Number.isFinite(secPerKm) || secPerKm <= 0) {
    return "—";
  }
  const total = Math.round(secPerKm);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

// "H:MM:SS" when there are whole hours, otherwise "M:SS". Mirrors the run
// table's duration style.
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// "12.3 km" — one decimal place.
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}
