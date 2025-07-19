import z from "zod";
import { UserRole } from "@/models/user";

export const CreateUserPayloadSchema = z.object({
  userName: z.string().min(4),
  alias: z.string().min(4),
  password: z.string().min(8),
  role: z.enum(UserRole).optional(),
});