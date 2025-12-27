import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  USDA_API_KEY: z
    .string()
    .min(1, "USDA_API_KEY is required for ingredient search"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_RESEND_KEY: z.string().optional(),
  AUTH_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
