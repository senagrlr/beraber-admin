// src\data\services\team.service.ts
import type { ITeamRepo, TeamMember, TeamRole } from "@/data/repositories/team.repo";
import { getAuth } from "firebase/auth";
import type { Unsubscribe } from "firebase/firestore";

export interface AddTeamMemberInput {
  email: string;
  roles: TeamRole[];     // örn: ["admin"] | ["editor"]
  active: boolean;
  name?: string | null;
  phone?: string | null;
}

export class TeamService {
  constructor(private repo: ITeamRepo) {}

  /** Yeni/var olan üyeyi upsert eder; createdBy otomatik yazılır. */
  async addMember(input: AddTeamMemberInput) {
    const emailLower = (input.email || "").trim().toLowerCase();
    const auth = getAuth();
    const createdBy = auth.currentUser?.uid ?? null;

    if (!emailLower || !emailLower.includes("@")) {
      throw new Error("Geçerli bir e-posta girin.");
    }

    await this.repo.upsertByEmailLower(emailLower, {
      email: emailLower,
      roles: (input.roles?.length ? input.roles : ["editor"]),
      active: Boolean(input.active),
      name: input.name ?? null,
      phone: input.phone ?? null,
      createdBy,
    } as Omit<TeamMember, "id" | "createdAt" | "updatedAt">);
  }

  /** Whitelist kontrolü (geriye dönük kullanım için) */
  async isEmailAllowed(email: string): Promise<boolean> {
    const normalized = (email || "").trim().toLowerCase();
    const member = await this.repo.findByEmailLower(normalized);
    return !!member?.active;
  }

  async getMemberByEmail(email: string): Promise<TeamMember | null> {
    const normalized = (email || "").trim().toLowerCase();
    return this.repo.findByEmailLower(normalized);
  }

  listenTeam(cb: (rows: TeamMember[]) => void, limitN = 100): Unsubscribe {
    return this.repo.listenActive(limitN, cb);
  }

  listenAll(cb: (rows: TeamMember[]) => void, limitN = 100): Unsubscribe {
    return this.repo.listenActive(limitN, cb);
  }

  listActive(limitN = 100) {
    return this.repo.listActive(limitN);
  }
}
