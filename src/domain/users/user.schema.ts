// src\domain\users\user.schema.ts
import { z } from "zod";

export const UserWriteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
});

export type UserWrite = z.infer<typeof UserWriteSchema>;
