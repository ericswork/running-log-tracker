import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../prisma";
import { createRunSchema, updateRunSchema, listRunsQuerySchema } from "./schemas";
import { parseBody } from "../lib/validation";

const notFound = (res: Response) =>
  res.status(404).json({ error: "NotFound", message: "Run not found" });

// POST /api/runs — validate, persist, 201 with the created run.
export async function createRun(req: Request, res: Response): Promise<void> {
  const parsed = parseBody(createRunSchema, req.body);
  if (!parsed.ok) {
    res.status(parsed.status).json(parsed.body);
    return;
  }
  const run = await prisma.run.create({ data: parsed.data });
  res.status(201).json(run);
}

// GET /api/runs — a page of runs, sorted and narrowed by optional AND-combined
// filters (whole-day date range, distance band, run types). Returns the envelope
// { runs, total, limit, offset } where total counts the full filtered set.
export async function listRuns(req: Request, res: Response): Promise<void> {
  const parsed = parseBody(listRunsQuerySchema, req.query);
  if (!parsed.ok) {
    res.status(parsed.status).json(parsed.body);
    return;
  }
  const { from, to, minDistanceKm, maxDistanceKm, type, limit, offset, sort, order } =
    parsed.data;

  const where: Prisma.RunWhereInput = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.date.lte = new Date(`${to}T23:59:59.999Z`);
  }
  if (minDistanceKm !== undefined || maxDistanceKm !== undefined) {
    where.distanceKm = {};
    if (minDistanceKm !== undefined) where.distanceKm.gte = minDistanceKm;
    if (maxDistanceKm !== undefined) where.distanceKm.lte = maxDistanceKm;
  }
  if (type && type.length) where.type = { in: type };

  // Secondary id tie-break keeps paging stable across rows with equal sort keys.
  const orderBy: Prisma.RunOrderByWithRelationInput[] = [
    { [sort]: order } as Prisma.RunOrderByWithRelationInput,
    { id: "desc" },
  ];

  const [runs, total] = await Promise.all([
    prisma.run.findMany({ where, orderBy, skip: offset, take: limit }),
    prisma.run.count({ where }),
  ]);

  res.json({ runs, total, limit, offset });
}

// GET /api/runs/:id — the run, or 404.
export async function getRunById(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const run = await prisma.run.findUnique({ where: { id: req.params.id } });
  if (!run) {
    notFound(res);
    return;
  }
  res.json(run);
}

// PATCH /api/runs/:id — validate (partial), 200 with updated run, or 404.
export async function updateRun(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const parsed = parseBody(updateRunSchema, req.body);
  if (!parsed.ok) {
    res.status(parsed.status).json(parsed.body);
    return;
  }
  const existing = await prisma.run.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    notFound(res);
    return;
  }
  const run = await prisma.run.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(run);
}

// DELETE /api/runs/:id — 204 on success, or 404.
export async function deleteRun(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const existing = await prisma.run.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    notFound(res);
    return;
  }
  await prisma.run.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
