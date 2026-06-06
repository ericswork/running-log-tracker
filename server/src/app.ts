import express from "express";
import { runsRouter } from "./runs/router";

// The configured Express app — no network listener, so it can be imported by
// tests (Supertest) without binding a port. `index.ts` calls listen().
export const app = express();

// Parse JSON request bodies.
app.use(express.json());

// Health check — confirms the server is up.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Run CRUD endpoints.
app.use("/api/runs", runsRouter);
