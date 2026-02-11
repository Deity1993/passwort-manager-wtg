import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });
  res.json({ logs });
});

export default router;
