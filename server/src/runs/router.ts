import { Router } from "express";
import {
  createRun,
  listRuns,
  getRunById,
  updateRun,
  deleteRun,
} from "./controller";
import { gpxUpload, importRun } from "./import";

export const runsRouter = Router();

// Parse an uploaded .gpx into run fields (does not persist).
runsRouter.post("/import", gpxUpload, importRun);

runsRouter.post("/", createRun);
runsRouter.get("/", listRuns);
runsRouter.get("/:id", getRunById);
runsRouter.patch("/:id", updateRun); // PATCH = partial update
runsRouter.delete("/:id", deleteRun);
