import { SignJWT, jwtVerify } from "jose";

import { env } from "../env.js";

const encoder = new TextEncoder();

function getSecret() {
  return encoder.encode(env.JWT_SECRET);
}

export async function signAccessToken(userId: number, role: "student" | "admin") {
  const secret = getSecret();
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  const sub = payload.sub;
  if (typeof sub !== "string" || !Number.isFinite(Number(sub))) {
    throw new Error("Invalid token payload");
  }
  return { userId: Number(sub) };
}
