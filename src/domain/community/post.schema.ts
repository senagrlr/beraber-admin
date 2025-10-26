// src\domain\community\post.schema.ts
import { z } from "zod";

export const CommunityPostWriteSchema = z.object({
  photoUrl: z.string().url("Geçerli bir URL giriniz"),
  text: z.string().optional(),
});

export type CommunityPostWrite = z.infer<typeof CommunityPostWriteSchema>;
