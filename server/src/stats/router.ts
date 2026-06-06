import { Router } from "express";
import { getSummary, getWeekly, getPace, getByType } from "./controller";

export const statsRouter = Router();

// Read-only analytics derived from existing runs (no persistence).
statsRouter.get("/summary", getSummary);
statsRouter.get("/weekly", getWeekly);
statsRouter.get("/pace", getPace);
statsRouter.get("/by-type", getByType);
