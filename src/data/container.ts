// src/data/container.ts
import { auth, db, storage } from "@/services/firebase";

// Repos
import { FirestoreDonationsRepo } from "@/data/repositories/donations.repo";
import { FirestoreCommunityRepo } from "@/data/repositories/community.repo";
import { FirestoreUsersRepo } from "@/data/repositories/users.repo";
import { FirestoreNotificationsRepo } from "@/data/repositories/notifications.repo";
import { FirestoreTeamRepo } from "@/data/repositories/team.repo";
import { FirestoreTodosRepo } from "@/data/repositories/todos.repo";
import { FirestoreUserStatsRepo } from "@/data/repositories/userStats.repo";

// Services
import { DonationsService } from "@/data/services/donations.service";
import { CommunityService } from "@/data/services/community.service";
import { NotificationsService } from "@/data/services/notifications.service";
import { TeamService } from "@/data/services/team.service";
import { TodosService } from "@/data/services/todos.service";
import { UserStatsService } from "@/data/services/userStats.service";

// Instantiate repos
const donationsRepo = new FirestoreDonationsRepo(db as any, storage as any);
const communityRepo = new FirestoreCommunityRepo(db as any);
const usersRepo = new FirestoreUsersRepo(db as any);
const notificationsRepo = new FirestoreNotificationsRepo(db as any);
const teamRepo = new FirestoreTeamRepo(db as any);
const todosRepo = new FirestoreTodosRepo(db as any);
const userStatsRepo = new FirestoreUserStatsRepo(db as any);

// Instantiate services
export const donationsService = new DonationsService(donationsRepo);
export const communityService = new CommunityService(communityRepo, db as any, storage as any);
export const notificationsService = new NotificationsService(notificationsRepo);
export const teamService = new TeamService(teamRepo);
export const todosService = new TodosService(todosRepo);
export const userStatsService = new UserStatsService(userStatsRepo);

// UI geriye uyumluluk alias’ları
export const usersService = {
  isEmailAllowed: (email: string) => teamService.isEmailAllowed(email),
  getMemberByEmail: (email: string) => teamService.getMemberByEmail(email),
  fetchMonthlyUserCounts: (year: number) => userStatsService.fetchMonthlyUserCounts(year),
};

// Settings sayfası: teamsService
export const teamsService = teamService;

export { usersRepo, auth };
