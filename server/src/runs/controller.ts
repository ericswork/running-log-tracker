import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { createRunSchema, updateRunSchema } from "./schemas";
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

// GET /api/runs — all runs, newest first (empty array when none).
export async function listRuns(_req: Request, res: Response): Promise<void> {
  const runs = await prisma.run.findMany({ orderBy: { date: "desc" } });
  res.json(runs);
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
