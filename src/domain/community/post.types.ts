// src\domain\community\post.types.ts
export type CommunityStatus = "active" | "deleted";

export type Highlight = {
  id: string;
  monthKey?: string;
  photoUrl?: string;
  status?: CommunityStatus;
  createdAt?: any; // Firestore Timestamp | Date
  updatedAt?: any;
};

export type CommunityPost = {
  id: string;
  text?: string;
  photoUrl?: string;
  status?: CommunityStatus;
  createdAt?: any; // Firestore Timestamp | Date
  updatedAt?: any;
};