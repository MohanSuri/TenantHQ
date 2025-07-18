import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB_CONNECTION_URI: z.string().url(),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRY: z.string().default("1h"),
});
