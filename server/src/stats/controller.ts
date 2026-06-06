import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { parseBody } from "../lib/validation";
import { statsQuerySchema, type StatsQuery } from "./schemas";
import {
  summarize,
  weeklyMileage,
  paceTrend,
  typeBreakdown,
  type StatsOptions,
} from "./buckets";

// Validate the shared query params and load every run. At single-user scale we
// bucket in JS over the full set rather than aggregating in SQL.
async function loadStats(
  req: Request,
  res: Response,
): Promise<{ runs: Awaited<ReturnType<typeof prisma.run.findMany>>; options: StatsOptions } | null> {
  const parsed = parseBody(statsQuerySchema, req.query);
  if (!parsed.ok) {
    res.status(parsed.status).json(parsed.body);
    return null;
  }
  const { from, to, timezone }: StatsQuery = parsed.data;
  const runs = await prisma.run.findMany();
  return { runs, options: { from, to, timezone } };
}

// GET /api/stats/summary — total runs, distance, and duration (canonical units).
export async function getSummary(req: Request, res: Response): Promise<void> {
  const loaded = await loadStats(req, res);
  if (!loaded) return;
  res.json(summarize(loaded.runs, loaded.options));
}

// GET /api/stats/weekly — distance + run count per Monday-start week (zero-filled).
export async function getWeekly(req: Request, res: Response): Promise<void> {
  const loaded = await loadStats(req, res);
  if (!loaded) return;
  res.json({ weeks: weeklyMileage(loaded.runs, loaded.options) });
}

// GET /api/stats/pace — distance + duration per week so the client derives pace.
export async function getPace(req: Request, res: Response): Promise<void> {
  const loaded = await loadStats(req, res);
  if (!loaded) return;
  res.json({ periods: paceTrend(loaded.runs, loaded.options) });
}

// GET /api/stats/by-type — count + distance per run type, canonical-order.
export async function getByType(req: Request, res: Response): Promise<void> {
  const loaded = await loadStats(req, res);
  if (!loaded) return;
  res.json({ types: typeBreakdown(loaded.runs, loaded.options) });
}
