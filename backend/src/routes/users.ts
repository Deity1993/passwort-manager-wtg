import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { hashPassword } from "../utils/password.js";

const router = Router();

const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "USER"]).default("USER")
});

const updateUserSchema = z.object({
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  active: z.boolean().optional()
});

router.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, active: true, createdAt: true }
  });
  res.json({ users });
});

router.post("/", async (req, res) => {
  const data = createUserSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ error: data.error.flatten() });
  }

  const passwordHash = await hashPassword(data.data.password);
  const user = await prisma.user.create({
    data: {
      username: data.data.username,
      passwordHash,
      role: data.data.role
    },
    select: { id: true, username: true, role: true, active: true, createdAt: true }
  });

  return res.status(201).json({ user });
});

router.patch("/:id", async (req, res) => {
  const data = updateUserSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ error: data.error.flatten() });
  }

  const updateData: { passwordHash?: string; role?: "ADMIN" | "USER"; active?: boolean } = {};
  if (data.data.password) {
    updateData.passwordHash = await hashPassword(data.data.password);
  }
  if (data.data.role) updateData.role = data.data.role;
  if (typeof data.data.active === "boolean") updateData.active = data.data.active;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: { id: true, username: true, role: true, active: true, createdAt: true }
  });

  return res.json({ user });
});

export default router;
