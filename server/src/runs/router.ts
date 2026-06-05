import { Router } from "express";
import {
  createRun,
  listRuns,
  getRunById,
  updateRun,
  deleteRun,
} from "./controller";

export const runsRouter = Router();

runsRouter.post("/", createRun);
runsRouter.get("/", listRuns);
runsRouter.get("/:id", getRunById);
runsRouter.patch("/:id", updateRun); // PATCH = partial update
runsRouter.delete("/:id", deleteRun);
