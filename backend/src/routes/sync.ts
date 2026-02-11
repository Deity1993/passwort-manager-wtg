import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

const incomingCustomer = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  version: z.number().int().min(1),
  deleted: z.boolean().optional()
});

const incomingCredential = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  title: z.string().min(1),
  username: z.string().min(1),
  encryptedPassword: z.string().min(1),
  iv: z.string().min(1),
  url: z.string().optional(),
  notes: z.string().optional(),
  version: z.number().int().min(1),
  deleted: z.boolean().optional()
});

const pushSchema = z.object({
  customers: z.array(incomingCustomer).default([]),
  credentials: z.array(incomingCredential).default([])
});

router.get("/pull", async (req, res) => {
  const sinceParam = req.query.since;
  const since = typeof sinceParam === "string" ? new Date(Number(sinceParam)) : null;
  if (!since || Number.isNaN(since.getTime())) {
    return res.status(400).json({ error: "Invalid since" });
  }

  const customers = await prisma.customer.findMany({
    where: { updatedAt: { gt: since } },
    orderBy: { updatedAt: "asc" }
  });

  const credentials = await prisma.credential.findMany({
    where: { updatedAt: { gt: since } },
    orderBy: { updatedAt: "asc" }
  });

  return res.json({ customers, credentials, serverTime: Date.now() });
});

router.post("/push", async (req: AuthRequest, res) => {
  const data = pushSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ error: data.error.flatten() });
  }

  const conflicts: { customers: unknown[]; credentials: unknown[] } = { customers: [], credentials: [] };
  const applied: { customers: unknown[]; credentials: unknown[] } = { customers: [], credentials: [] };

  for (const incoming of data.data.customers) {
    const existing = await prisma.customer.findUnique({ where: { id: incoming.id } });
    if (!existing) {
      const created = await prisma.customer.create({
        data: {
          id: incoming.id,
          name: incoming.name,
          email: incoming.email,
          company: incoming.company,
          deletedAt: incoming.deleted ? new Date() : null,
          version: incoming.version,
          updatedById: req.user?.id
        }
      });
      applied.customers.push(created);
      await prisma.auditLog.create({
        data: {
          entityType: "customer",
          entityId: created.id,
          action: "create",
          details: `Sync create customer ${created.name}`,
          userId: req.user?.id
        }
      });
      continue;
    }

    if (incoming.version < existing.version) {
      conflicts.customers.push(existing);
      continue;
    }

    const updated = await prisma.customer.update({
      where: { id: incoming.id },
      data: {
        name: incoming.name,
        email: incoming.email,
        company: incoming.company,
        deletedAt: incoming.deleted ? new Date() : null,
        version: existing.version + 1,
        updatedById: req.user?.id
      }
    });
    applied.customers.push(updated);
    await prisma.auditLog.create({
      data: {
        entityType: "customer",
        entityId: updated.id,
        action: incoming.deleted ? "delete" : "update",
        details: `Sync update customer ${updated.name}`,
        userId: req.user?.id
      }
    });
  }

  for (const incoming of data.data.credentials) {
    const existing = await prisma.credential.findUnique({ where: { id: incoming.id } });
    if (!existing) {
      const created = await prisma.credential.create({
        data: {
          id: incoming.id,
          customerId: incoming.customerId,
          title: incoming.title,
          username: incoming.username,
          encryptedPassword: incoming.encryptedPassword,
          iv: incoming.iv,
          url: incoming.url,
          notes: incoming.notes,
          deletedAt: incoming.deleted ? new Date() : null,
          version: incoming.version,
          updatedById: req.user?.id
        }
      });
      applied.credentials.push(created);
      await prisma.auditLog.create({
        data: {
          entityType: "credential",
          entityId: created.id,
          action: "create",
          details: `Sync create credential ${created.title}`,
          userId: req.user?.id
        }
      });
      continue;
    }

    if (incoming.version < existing.version) {
      conflicts.credentials.push(existing);
      continue;
    }

    const updated = await prisma.credential.update({
      where: { id: incoming.id },
      data: {
        customerId: incoming.customerId,
        title: incoming.title,
        username: incoming.username,
        encryptedPassword: incoming.encryptedPassword,
        iv: incoming.iv,
        url: incoming.url,
        notes: incoming.notes,
        deletedAt: incoming.deleted ? new Date() : null,
        version: existing.version + 1,
        updatedById: req.user?.id
      }
    });
    applied.credentials.push(updated);
    await prisma.auditLog.create({
      data: {
        entityType: "credential",
        entityId: updated.id,
        action: incoming.deleted ? "delete" : "update",
        details: `Sync update credential ${updated.title}`,
        userId: req.user?.id
      }
    });
  }

  return res.json({ applied, conflicts, serverTime: Date.now() });
});

export default router;
