import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

const credentialSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1),
  username: z.string().min(1),
  encryptedPassword: z.string().min(1),
  iv: z.string().min(1),
  url: z.string().optional(),
  notes: z.string().optional()
});

const credentialCreateSchema = credentialSchema.extend({
  id: z.string().min(1).optional()
});

router.get("/", async (_req, res) => {
  const credentials = await prisma.credential.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" }
  });
  res.json({ credentials });
});

router.post("/", async (req: AuthRequest, res) => {
  const data = credentialCreateSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ error: data.error.flatten() });
  }

  const credential = await prisma.credential.create({
    data: {
      ...(data.data.id ? { id: data.data.id } : {}),
      ...data.data,
      updatedById: req.user?.id
    }
  });

  await prisma.auditLog.create({
    data: {
      entityType: "credential",
      entityId: credential.id,
      action: "create",
      details: `Created credential ${credential.title}`,
      userId: req.user?.id
    }
  });

  return res.status(201).json({ credential });
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const data = credentialSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ error: data.error.flatten() });
  }

  const existing = await prisma.credential.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.deletedAt) {
    return res.status(404).json({ error: "Credential not found" });
  }

  const credential = await prisma.credential.update({
    where: { id: req.params.id },
    data: {
      ...data.data,
      version: existing.version + 1,
      updatedById: req.user?.id
    }
  });

  await prisma.auditLog.create({
    data: {
      entityType: "credential",
      entityId: credential.id,
      action: "update",
      details: `Updated credential ${credential.title}`,
      userId: req.user?.id
    }
  });

  return res.json({ credential });
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.credential.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.deletedAt) {
    return res.status(404).json({ error: "Credential not found" });
  }

  const credential = await prisma.credential.update({
    where: { id: req.params.id },
    data: {
      deletedAt: new Date(),
      version: existing.version + 1,
      updatedById: req.user?.id
    }
  });

  await prisma.auditLog.create({
    data: {
      entityType: "credential",
      entityId: credential.id,
      action: "delete",
      details: `Deleted credential ${credential.title}`,
      userId: req.user?.id
    }
  });

  return res.json({ credential });
});

export default router;
