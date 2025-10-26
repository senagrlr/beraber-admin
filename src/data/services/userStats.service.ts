// src/data/services/userStats.service.ts

import type { IUserStatsRepo, MonthlyUserCount } from "@/data/repositories/userStats.repo";

export class UserStatsService {
  constructor(private repo: IUserStatsRepo) {}

  fetchMonthlyUserCounts(year: number): Promise<MonthlyUserCount[]> {
    return this.repo.fetchMonthlyUserCounts(year);
  }

  getGlobalTotalUsers(): Promise<number> {
    return this.repo.getGlobalTotalUsers();
  }
}
