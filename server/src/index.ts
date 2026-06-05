import express from "express";

const app = express();
const PORT = process.env.PORT ?? 4000;

// Parse JSON request bodies (needed for POST/PUT later).
app.use(express.json());

// Health check — confirms the server is up.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
