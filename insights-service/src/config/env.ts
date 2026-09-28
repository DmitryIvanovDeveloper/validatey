import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8090),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  INTERNAL_SERVICE_TOKEN: z.string().min(16, "INTERNAL_SERVICE_TOKEN must be at least 16 characters"),
});

export type ServiceEnv = z.infer<typeof envSchema>;
export const env: ServiceEnv = envSchema.parse(process.env);
