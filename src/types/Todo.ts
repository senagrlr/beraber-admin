import { Timestamp } from "firebase/firestore";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: Timestamp | null;
  completedAt: Timestamp | null;
  createdBy?: string;
}
