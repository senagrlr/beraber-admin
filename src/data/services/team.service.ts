// src/data/services/team.service.ts
import type { ITeamRepo, TeamMember } from "@/data/repositories/team.repo";
import type { Unsubscribe } from "firebase/firestore";

export class TeamService {
  constructor(private repo: ITeamRepo) {}

  /** Whitelist kontrolü */
  async isEmailAllowed(email: string): Promise<boolean> {
    const normalized = (email || "").trim().toLowerCase();
    const member = await this.repo.findByEmailLower(normalized);
    return !!member;
  }

  /** Üyeyi e-posta ile getir */
  async getMemberByEmail(email: string): Promise<TeamMember | null> {
    const normalized = (email || "").trim().toLowerCase();
    return this.repo.findByEmailLower(normalized);
  }

  /** Eski kullanım: listenTeam(cb, limit?) */
  listenTeam(cb: (rows: TeamMember[]) => void, limitN = 100): Unsubscribe {
    return this.repo.listenActive(limitN, cb);
  }

  /** Settings/BeraberEkibi.tsx’in beklediği alias: listenAll(cb, limit?) */
  listenAll(cb: (rows: TeamMember[]) => void, limitN = 100): Unsubscribe {
    return this.repo.listenActive(limitN, cb);
  }

  /** İhtiyaç olursa: anlık liste çekme */
  listActive(limitN = 100) {
    return this.repo.listActive(limitN);
  }
}
