import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "";

const credentialsSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8)
});

router.post("/bootstrap", async (req, res) => {
  const data = credentialsSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ error: data.error.flatten() });
  }

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return res.status(409).json({ error: "Admin already exists" });
  }

  const passwordHash = await hashPassword(data.data.password);
  const user = await prisma.user.create({
    data: {
      username: data.data.username,
      passwordHash,
      role: "ADMIN"
    }
  });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.post("/login", async (req, res) => {
  const data = credentialsSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ error: data.error.flatten() });
  }

  const user = await prisma.user.findUnique({ where: { username: data.data.username } });
  if (!user || !user.active) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await verifyPassword(data.data.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

export default router;
