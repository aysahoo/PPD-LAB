import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { signAccessToken } from "../auth/jwt.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { authenticate } from "../auth/guards.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const ACCESS_EXPIRES_SEC = 7 * 24 * 60 * 60;

function mapUser(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.isActive ?? true,
  };
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown) {
  const r = schema.safeParse(body);
  if (!r.success) {
    const msg = r.error.flatten().fieldErrors;
    const first = Object.values(msg).flat()[0] ?? "Invalid request body";
    return { ok: false as const, error: first };
  }
  return { ok: true as const, data: r.data };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const parsed = parseBody(registerBody, request.body);
    if (!parsed.ok) {
      return reply.code(400).send({ message: parsed.error });
    }
    const { email, password, name, phone } = parsed.data;
    const passwordHash = await hashPassword(password);
    try {
      const [inserted] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          name: name ?? null,
          phone: phone ?? null,
          role: "student",
          isActive: true,
        })
        .returning();
      if (!inserted) {
        return reply.code(500).send({ message: "Registration failed" });
      }
      return reply.code(201).send(mapUser(inserted));
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        return reply.code(409).send({ message: "Email already registered" });
      }
      throw err;
    }
  });

  app.post("/login", async (request, reply) => {
    const parsed = parseBody(loginBody, request.body);
    if (!parsed.ok) {
      return reply.code(400).send({ message: parsed.error });
    }
    const { email, password } = parsed.data;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return reply.code(403).send({ message: "Account is inactive" });
    }
    if (user.role !== "student" && user.role !== "admin") {
      return reply.code(403).send({ message: "Invalid role" });
    }
    const accessToken = await signAccessToken(user.id, user.role);
    return reply.send({
      accessToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_EXPIRES_SEC,
    });
  });

  app.get(
    "/me",
    { preHandler: authenticate },
    async (request, reply) => {
      const uid = request.user!.id;
      const [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
      if (!user) {
        return reply.code(404).send({ message: "User not found" });
      }
      return mapUser(user);
    },
  );

  app.post(
    "/logout",
    { preHandler: authenticate },
    async (_request, reply) => {
      return reply.send({ message: "Logged out" });
    },
  );

  app.post(
    "/change-password",
    { preHandler: authenticate },
    async (request, reply) => {
      const parsed = parseBody(changePasswordBody, request.body);
      if (!parsed.ok) {
        return reply.code(400).send({ message: parsed.error });
      }
      const uid = request.user!.id;
      const [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
      if (!user) {
        return reply.code(404).send({ message: "User not found" });
      }
      const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
      if (!ok) {
        return reply.code(401).send({ message: "Current password is incorrect" });
      }
      const newHash = await hashPassword(parsed.data.newPassword);
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, uid));
      return reply.send({ message: "Password updated" });
    },
  );
}
