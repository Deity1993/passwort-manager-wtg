import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import customersRoutes from "./routes/customers.js";
import credentialsRoutes from "./routes/credentials.js";
import syncRoutes from "./routes/sync.js";
import auditRoutes from "./routes/audit.js";
import { requireAdmin, requireAuth } from "./middleware/auth.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/users", requireAuth, requireAdmin, usersRoutes);
app.use("/customers", requireAuth, customersRoutes);
app.use("/credentials", requireAuth, credentialsRoutes);
app.use("/sync", requireAuth, syncRoutes);
app.use("/audit", requireAuth, auditRoutes);

app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
