import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().optional().default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  CLIENT_ORIGIN: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  /** Pino log level (e.g. info, warn, error, debug). */
  LOG_LEVEL: z.string().optional().default("info"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
