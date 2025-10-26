// src/domain/community/post.mapper.ts
import type { CommunityPost, Highlight } from "./post.types";

/** Firestore Timestamp | string | number | Date -> Date | undefined */
const toDate = (v: any | undefined): Date | undefined => {
  if (!v) return undefined;
  if (typeof v?.toDate === "function") return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};

/** Firestore doc -> CommunityPost */
export function toCommunityPost(id: string, data: any): CommunityPost {
  return {
    id,
    text: data?.text ?? "",
    photoUrl: data?.photoUrl ?? "",
    status: (data?.status as any) ?? "active",
    createdAt: data?.createdAt ?? toDate(data?.createdAt) ?? undefined,
    updatedAt: data?.updatedAt ?? toDate(data?.updatedAt) ?? undefined,
  };
}

/** Firestore doc -> Highlight (Beraber’de Bu Ay) */
export function toHighlight(id: string, data: any): Highlight {
  return {
    id,
    monthKey: data?.monthKey ?? id,
    photoUrl: data?.photoUrl ?? "",
    status: (data?.status as any) ?? "active",
    createdAt: data?.createdAt ?? toDate(data?.createdAt) ?? undefined,
    updatedAt: data?.updatedAt ?? toDate(data?.updatedAt) ?? undefined,
  };
}
