// src\domain\users\user.types.ts
export interface AppUser {
  id: string;           // uid
  email?: string;
  name?: string;
  phone?: string;
  role?: "admin" | "user";
  createdAt?: Date;
  updatedAt?: Date;
}
