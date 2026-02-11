import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional()
});

const customerCreateSchema = customerSchema.extend({
  id: z.string().min(1).optional()
});

router.get("/", async (_req, res) => {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" }
  });
  res.json({ customers });
});

router.post("/", async (req: AuthRequest, res) => {
  const data = customerCreateSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ error: data.error.flatten() });
  }

  const customer = await prisma.customer.create({
    data: {
      ...(data.data.id ? { id: data.data.id } : {}),
      ...data.data,
      updatedById: req.user?.id
    }
  });

  await prisma.auditLog.create({
    data: {
      entityType: "customer",
      entityId: customer.id,
      action: "create",
      details: `Created customer ${customer.name}`,
      userId: req.user?.id
    }
  });

  return res.status(201).json({ customer });
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const data = customerSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ error: data.error.flatten() });
  }

  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.deletedAt) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      ...data.data,
      version: existing.version + 1,
      updatedById: req.user?.id
    }
  });

  await prisma.auditLog.create({
    data: {
      entityType: "customer",
      entityId: customer.id,
      action: "update",
      details: `Updated customer ${customer.name}`,
      userId: req.user?.id
    }
  });

  return res.json({ customer });
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.deletedAt) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      deletedAt: new Date(),
      version: existing.version + 1,
      updatedById: req.user?.id
    }
  });

  await prisma.auditLog.create({
    data: {
      entityType: "customer",
      entityId: customer.id,
      action: "delete",
      details: `Deleted customer ${customer.name}`,
      userId: req.user?.id
    }
  });

  return res.json({ customer });
});

export default router;
