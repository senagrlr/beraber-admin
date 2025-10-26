// src/constants/firestore.ts

export const COLLECTIONS = {
  DONATIONS: "donations",
  NOTIFICATIONS: "notifications",
  TEAM_MEMBERS: "team_members",
  USERS: "users",
  USER_STATS: "userStats",
  TODOS: "todos",
  HIGHLIGHTS: "beraberde_bu_ay",
  COMMUNITY_POSTS: "topluluk_gonderileri",
} as const;

export type CollectionKey = keyof typeof COLLECTIONS;
export type CollectionName = (typeof COLLECTIONS)[CollectionKey];
