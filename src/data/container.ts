// src/data/container.ts
import { auth, db, storage } from "@/services/firebase";

// ─── Repos ────────────────────────────────────────────────────────────────
import { FirestoreDonationsRepo } from "@/data/repositories/donations.repo";
import { FirestoreCommunityRepo } from "@/data/repositories/community.repo";
import { FirestoreUsersRepo } from "@/data/repositories/users.repo";
import { FirestoreNotificationsRepo } from "@/data/repositories/notifications.repo";
import { FirestoreTeamRepo } from "@/data/repositories/team.repo";
import { FirestoreTodosRepo } from "@/data/repositories/todos.repo";
import { FirestoreUserStatsRepo } from "@/data/repositories/userStats.repo";

// ─── Services ─────────────────────────────────────────────────────────────
import { DonationsService } from "@/data/services/donations.service";
import { CommunityService } from "@/data/services/community.service";
import { NotificationsService } from "@/data/services/notifications.service";
import { TeamService } from "@/data/services/team.service";
import { TodosService } from "@/data/services/todos.service";
import { UserStatsService } from "@/data/services/userStats.service";

// ─── Instantiate repos ────────────────────────────────────────────────────
const donationsRepo = new FirestoreDonationsRepo(db as any, storage as any);
const communityRepo = new FirestoreCommunityRepo(db as any);
const usersRepo = new FirestoreUsersRepo(db as any);
const notificationsRepo = new FirestoreNotificationsRepo(db as any);
const teamRepo = new FirestoreTeamRepo(db as any);
const todosRepo = new FirestoreTodosRepo(db as any);
const userStatsRepo = new FirestoreUserStatsRepo(db as any);

// ─── Instantiate services (singletons) ────────────────────────────────────
export const donationsService = new DonationsService(donationsRepo);
export const communityService = new CommunityService(communityRepo, db as any, storage as any);
export const notificationsService = new NotificationsService(notificationsRepo);
export const teamService = new TeamService(teamRepo);
export const todosService = new TodosService(todosRepo);
export const userStatsService = new UserStatsService(userStatsRepo);

// Geriye uyumluluk alias’ları
export const usersService = {
  isEmailAllowed: (email: string) => teamService.isEmailAllowed(email),
  getMemberByEmail: (email: string) => teamService.getMemberByEmail(email),
  fetchMonthlyUserCounts: (year: number) => userStatsService.fetchMonthlyUserCounts(year),
};

// Settings sayfası: teamsService (eski ad)
export const teamsService = teamService;

// ─── Mini IoC Container (EKLENDİ) ─────────────────────────────────────────
type Tokens =
  | "auth" | "firestore" | "storage"
  | "donationsRepo" | "communityRepo" | "usersRepo" | "notificationsRepo" | "teamRepo" | "todosRepo" | "userStatsRepo"
  | "donationsService" | "communityService" | "notificationsService" | "teamService" | "todosService" | "userStatsService";

const registry = new Map<Tokens, unknown>();

function createContainer() {
  if (!registry.has("auth")) registry.set("auth", auth);
  if (!registry.has("firestore")) registry.set("firestore", db);
  if (!registry.has("storage")) registry.set("storage", storage);

  if (!registry.has("donationsRepo")) registry.set("donationsRepo", donationsRepo);
  if (!registry.has("communityRepo")) registry.set("communityRepo", communityRepo);
  if (!registry.has("usersRepo")) registry.set("usersRepo", usersRepo);
  if (!registry.has("notificationsRepo")) registry.set("notificationsRepo", notificationsRepo);
  if (!registry.has("teamRepo")) registry.set("teamRepo", teamRepo);
  if (!registry.has("todosRepo")) registry.set("todosRepo", todosRepo);
  if (!registry.has("userStatsRepo")) registry.set("userStatsRepo", userStatsRepo);

  if (!registry.has("donationsService")) registry.set("donationsService", donationsService);
  if (!registry.has("communityService")) registry.set("communityService", communityService);
  if (!registry.has("notificationsService")) registry.set("notificationsService", notificationsService);
  if (!registry.has("teamService")) registry.set("teamService", teamService);
  if (!registry.has("todosService")) registry.set("todosService", todosService);
  if (!registry.has("userStatsService")) registry.set("userStatsService", userStatsService);

  return {
    get<T = unknown>(token: Tokens) {
      const dep = registry.get(token);
      if (!dep) throw new Error(`Container: missing token "${token}"`);
      return dep as T;
    },
  };
}

export type AppContainer = ReturnType<typeof createContainer>;
export const container: AppContainer = createContainer();

// Diğer dosyaların kullandığı named export’ları da aynen dışarı verelim:
export { auth, db, storage };
