import {
  users,
  hunts,
  clues,
  purchases,
  userProgress,
  badges,
  userBadges,
  collections,
  subscriptions,
  passwordResetTokens,
  userCreatedHunts,
  userCreatedClues,
  huntInvitations,
  huntSessions,
  huntParticipants,
  huntSessionProgress,
  clueAttempts,
  type User,
  type InsertUser,
  type Hunt,
  type InsertHunt,
  type Clue,
  type InsertClue,
  type Purchase,
  type InsertPurchase,
  type UserProgress,
  type InsertUserProgress,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type Collection,
  type InsertCollection,
  type Subscription,
  type InsertSubscription,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type UserCreatedHunt,
  type InsertUserCreatedHunt,
  type UserCreatedClue,
  type InsertUserCreatedClue,
  type HuntInvitation,
  type InsertHuntInvitation,
  type HuntSession,
  type InsertHuntSession,
  type HuntParticipant,
  type InsertHuntParticipant,
  type HuntSessionProgress,
  type InsertHuntSessionProgress,
  type ClueAttempt,
  type InsertClueAttempt,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc, desc, count, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: { name: string; email: string; password: string }): Promise<User>;
  
  // Hunt operations
  getAllHunts(): Promise<Hunt[]>;
  getHuntsByCategory(category: string): Promise<Hunt[]>;
  getHunt(id: string): Promise<Hunt | undefined>;
  createHunt(hunt: InsertHunt): Promise<Hunt>;
  updateHunt(id: string, updates: Partial<Hunt>): Promise<Hunt>;
  deleteHunt(id: string): Promise<void>;
  
  // Clue operations
  getCluesByHuntId(huntId: string): Promise<Clue[]>;
  getClue(id: string): Promise<Clue | undefined>;
  createClue(clue: InsertClue): Promise<Clue>;
  deleteClue(id: string): Promise<void>;
  deleteCluesByHuntId(huntId: string): Promise<void>;
  
  // Purchase operations
  getPurchasesByUserId(userId: string): Promise<Purchase[]>;
  getAllPurchases(): Promise<Purchase[]>;
  getUserPurchase(userId: string, huntId: string): Promise<Purchase | undefined>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  updatePurchase(id: string, updates: Partial<Purchase>): Promise<Purchase>;
  getPurchaseByReference(reference: string): Promise<Purchase | undefined>;
  
  // Subscription operations
  getUserActiveSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  getSubscriptionByReference(reference: string): Promise<Subscription | undefined>;
  hasActiveSubscription(userId: string): Promise<boolean>;
  
  // Progress operations
  getUserProgress(userId: string, huntId: string): Promise<UserProgress | undefined>;
  getAllUserProgress(): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: string, huntId: string, updates: Partial<UserProgress>): Promise<UserProgress>;
  getUserCompletedHunts(userId: string): Promise<(UserProgress & { hunt: Hunt })[]>;
  
  // Badge operations
  getAllBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userId: string, badgeId: string): Promise<UserBadge>;
  checkAndAwardBadges(userId: string, huntId: string): Promise<Badge[]>;
  
  // Collection operations
  getCollectionsByCategory(category: string): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  
  // Password reset token operations
  createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  getValidPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  invalidatePasswordResetToken(token: string): Promise<void>;
  updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;
  
  // User-created hunt operations
  createUserHunt(hunt: InsertUserCreatedHunt): Promise<UserCreatedHunt>;
  getUserHunts(userId: string): Promise<UserCreatedHunt[]>;
  getUserHunt(huntId: string, userId: string): Promise<UserCreatedHunt | undefined>;
  updateUserHunt(huntId: string, userId: string, updates: Partial<UserCreatedHunt>): Promise<UserCreatedHunt>;
  deleteUserHunt(huntId: string, userId: string): Promise<void>;
  getUserHuntByInviteCode(inviteCode: string): Promise<UserCreatedHunt | undefined>;
  
  // User-created clue operations
  createUserClue(clue: InsertUserCreatedClue): Promise<UserCreatedClue>;
  getUserClue(clueId: string): Promise<UserCreatedClue | undefined>;
  getUserCluesByHuntId(huntId: string): Promise<UserCreatedClue[]>;
  updateUserClue(clueId: string, updates: Partial<UserCreatedClue>): Promise<UserCreatedClue>;
  deleteUserClue(clueId: string): Promise<void>;
  
  // Hunt invitation operations
  createHuntInvitation(invitation: InsertHuntInvitation): Promise<HuntInvitation>;
  getHuntInvitations(huntId: string): Promise<HuntInvitation[]>;
  getUserInvitations(userId: string): Promise<(HuntInvitation & { hunt: UserCreatedHunt })[]>;
  respondToInvitation(inviteToken: string, userId: string, status: 'accepted' | 'declined'): Promise<HuntInvitation>;
  
  // Hunt session operations
  createHuntSession(session: InsertHuntSession): Promise<HuntSession>;
  getHuntSession(sessionId: string): Promise<HuntSession | undefined>;
  getHuntSessionByCode(sessionCode: string): Promise<HuntSession | undefined>;
  updateHuntSession(sessionId: string, updates: Partial<HuntSession>): Promise<HuntSession>;
  
  // Hunt participant operations
  addHuntParticipant(participant: InsertHuntParticipant): Promise<HuntParticipant>;
  getSessionParticipant(sessionId: string, userId: string): Promise<HuntParticipant | undefined>;
  getSessionParticipants(sessionId: string): Promise<(HuntParticipant & { user: User })[]>;
  removeHuntParticipant(sessionId: string, userId: string): Promise<void>;
  
  // Hunt session progress operations
  updateSessionProgress(progress: InsertHuntSessionProgress): Promise<HuntSessionProgress>;
  getSessionProgress(sessionId: string): Promise<HuntSessionProgress[]>;
  
  // Clue attempts operations
  getClueAttempt(userId: string, huntId: string, clueId: string): Promise<ClueAttempt | undefined>;
  incrementClueAttempt(userId: string, huntId: string, clueId: string): Promise<ClueAttempt>;
  markHintViewed(userId: string, huntId: string, clueId: string): Promise<ClueAttempt>;
  bypassClue(userId: string, huntId: string, clueId: string): Promise<ClueAttempt>;
  
  // Seed data
  seedDatabase(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: { name: string; email: string; password: string }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    // Set admin flag for specific email
    const isAdmin = userData.email === "Janet0mwende@gmail.com";
    const [user] = await db
      .insert(users)
      .values({ 
        name: userData.name,
        email: userData.email,
        passwordHash,
        isAdmin 
      })
      .returning();
    return user;
  }

  async getAllHunts(): Promise<Hunt[]> {
    return await db.select().from(hunts).orderBy(desc(hunts.createdAt));
  }

  async getHuntsByCategory(category: string): Promise<Hunt[]> {
    return await db.select().from(hunts).where(eq(hunts.category, category)).orderBy(desc(hunts.createdAt));
  }

  async getHunt(id: string): Promise<Hunt | undefined> {
    const [hunt] = await db.select().from(hunts).where(eq(hunts.id, id));
    return hunt;
  }

  async createHunt(huntData: InsertHunt): Promise<Hunt> {
    const [hunt] = await db.insert(hunts).values(huntData).returning();
    return hunt;
  }

  async updateHunt(id: string, updates: Partial<Hunt>): Promise<Hunt> {
    const [hunt] = await db.update(hunts)
      .set(updates)
      .where(eq(hunts.id, id))
      .returning();
    return hunt;
  }

  async deleteHunt(id: string): Promise<void> {
    // Delete all related data first
    await db.delete(clues).where(eq(clues.huntId, id));
    await db.delete(userProgress).where(eq(userProgress.huntId, id));
    await db.delete(purchases).where(eq(purchases.huntId, id));
    await db.delete(clueAttempts).where(eq(clueAttempts.huntId, id));
    // Delete the hunt
    await db.delete(hunts).where(eq(hunts.id, id));
  }

  async getCluesByHuntId(huntId: string): Promise<Clue[]> {
    return await db
      .select()
      .from(clues)
      .where(eq(clues.huntId, huntId))
      .orderBy(asc(clues.order));
  }

  async getClue(id: string): Promise<Clue | undefined> {
    const [clue] = await db.select().from(clues).where(eq(clues.id, id));
    return clue;
  }

  async createClue(clueData: InsertClue): Promise<Clue> {
    const [clue] = await db.insert(clues).values(clueData).returning();
    return clue;
  }

  async deleteClue(id: string): Promise<void> {
    await db.delete(clues).where(eq(clues.id, id));
  }

  async deleteCluesByHuntId(huntId: string): Promise<void> {
    await db.delete(clues).where(eq(clues.huntId, huntId));
  }

  async getPurchasesByUserId(userId: string): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.createdAt));
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases).orderBy(desc(purchases.createdAt));
  }

  async getUserPurchase(userId: string, huntId: string): Promise<Purchase | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.huntId, huntId)));
    return purchase;
  }

  async createPurchase(purchaseData: InsertPurchase): Promise<Purchase> {
    const [purchase] = await db.insert(purchases).values(purchaseData).returning();
    return purchase;
  }

  async updatePurchase(id: string, updates: Partial<Purchase>): Promise<Purchase> {
    const [purchase] = await db
      .update(purchases)
      .set(updates)
      .where(eq(purchases.id, id))
      .returning();
    return purchase;
  }

  async getPurchaseByReference(reference: string): Promise<Purchase | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.transactionReference, reference));
    return purchase;
  }

  // Subscription operations
  async getUserActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          sql`${subscriptions.expiryDate} > NOW()`
        )
      )
      .orderBy(desc(subscriptions.createdAt));
    return subscription;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async getSubscriptionByReference(reference: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.paymentReference, reference));
    return subscription;
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserActiveSubscription(userId);
    return !!subscription;
  }

  async getUserProgress(userId: string, huntId: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.huntId, huntId)));
    return progress;
  }

  async getAllUserProgress(): Promise<UserProgress[]> {
    return await db.select().from(userProgress);
  }

  async createUserProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    const [progress] = await db.insert(userProgress).values(progressData).returning();
    return progress;
  }

  async updateUserProgress(
    userId: string,
    huntId: string,
    updates: Partial<UserProgress>
  ): Promise<UserProgress> {
    const [progress] = await db
      .update(userProgress)
      .set(updates)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.huntId, huntId)))
      .returning();
    return progress;
  }

  async getUserCompletedHunts(userId: string): Promise<(UserProgress & { hunt: Hunt })[]> {
    return await db
      .select({
        id: userProgress.id,
        userId: userProgress.userId,
        huntId: userProgress.huntId,
        currentClueId: userProgress.currentClueId,
        completed: userProgress.completed,
        totalPoints: userProgress.totalPoints,
        completionTimeMinutes: userProgress.completionTimeMinutes,
        startedAt: userProgress.startedAt,
        completedAt: userProgress.completedAt,
        hunt: hunts,
      })
      .from(userProgress)
      .innerJoin(hunts, eq(userProgress.huntId, hunts.id))
      .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)))
      .orderBy(desc(userProgress.completedAt));
  }

  // Badge operations
  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges).orderBy(asc(badges.name));
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const results = await db
      .select()
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.dateAwarded));

    return results.map(result => ({
      ...result.user_badges,
      badge: result.badges!,
    }));
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    // Check if user already has this badge
    const existingBadge = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
      .limit(1);

    if (existingBadge.length > 0) {
      return existingBadge[0];
    }

    const [newBadge] = await db.insert(userBadges).values({
      userId,
      badgeId,
    }).returning();

    return newBadge;
  }

  async checkAndAwardBadges(userId: string, huntId: string): Promise<Badge[]> {
    const newBadges: Badge[] = [];
    
    // Get completed hunt info
    const [completedHunt] = await db.select().from(hunts).where(eq(hunts.id, huntId));
    if (!completedHunt) return newBadges;

    // Get user's completion stats
    const completedHunts = await db
      .select()
      .from(userProgress)
      .leftJoin(hunts, eq(userProgress.huntId, hunts.id))
      .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)));

    // Get all badges to check criteria
    const allBadges = await this.getAllBadges();
    const userCurrentBadges = await this.getUserBadges(userId);
    const userBadgeIds = userCurrentBadges.map(ub => ub.badgeId);

    for (const badge of allBadges) {
      if (userBadgeIds.includes(badge.id)) continue; // User already has this badge

      const criteria = badge.criteria as any;
      let shouldAward = false;

      switch (badge.name) {
        case "Heritage Explorer":
          // 2 hunts in History category
          const historyHunts = completedHunts.filter(h => h.hunts?.category === "History");
          shouldAward = historyHunts.length >= 2;
          break;

        case "Navigator":
          // Finish a Hard difficulty hunt
          const hardHunts = completedHunts.filter(h => h.hunts?.difficulty === "Hard");
          shouldAward = hardHunts.length > 0;
          break;

        case "Speed Hunter":
          // Fastest completion overall (award if completion time is the fastest so far)
          const fastestCompletions = await db
            .select()
            .from(userProgress)
            .where(and(eq(userProgress.completed, true), sql`completion_time_minutes IS NOT NULL`))
            .orderBy(asc(userProgress.completionTimeMinutes))
            .limit(1);
          
          const currentCompletion = await db
            .select()
            .from(userProgress)
            .where(and(eq(userProgress.userId, userId), eq(userProgress.huntId, huntId)))
            .limit(1);

          shouldAward = fastestCompletions.length > 0 && 
                       currentCompletion.length > 0 && 
                       fastestCompletions[0].id === currentCompletion[0].id;
          break;

        case "Culture Enthusiast":
          // 2 hunts in Cultural Heritage category
          const cultureHunts = completedHunts.filter(h => h.hunts?.category === "Cultural Heritage");
          shouldAward = cultureHunts.length >= 2;
          break;

        case "Adventure Master":
          // Most hunts completed overall (award if user has most completions)
          const [maxCompletions] = await db
            .select({ maxCount: count() })
            .from(userProgress)
            .where(eq(userProgress.completed, true))
            .groupBy(userProgress.userId)
            .orderBy(desc(count()))
            .limit(1);

          const userCompletions = completedHunts.length;
          shouldAward = maxCompletions && userCompletions >= maxCompletions.maxCount;
          break;
      }

      if (shouldAward) {
        await this.awardBadge(userId, badge.id);
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  // Collection operations
  async getCollectionsByCategory(category: string): Promise<Collection[]> {
    return await db
      .select()
      .from(collections)
      .where(eq(collections.categoryName, category))
      .orderBy(asc(collections.createdAt));
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db.insert(collections).values(collection).returning();
    return newCollection;
  }

  // Password reset token operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [newToken] = await db.insert(passwordResetTokens).values(tokenData).returning();
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async getValidPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      );
    return resetToken;
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));
  }

  // User-created hunt operations
  async createUserHunt(hunt: InsertUserCreatedHunt): Promise<UserCreatedHunt> {
    const [createdHunt] = await db.insert(userCreatedHunts).values(hunt).returning();
    return createdHunt;
  }

  async getUserHunts(userId: string): Promise<UserCreatedHunt[]> {
    return await db.select().from(userCreatedHunts)
      .where(eq(userCreatedHunts.creatorId, userId))
      .orderBy(desc(userCreatedHunts.createdAt));
  }

  async getUserHunt(huntId: string, userId: string): Promise<UserCreatedHunt | undefined> {
    const [hunt] = await db.select().from(userCreatedHunts)
      .where(and(eq(userCreatedHunts.id, huntId), eq(userCreatedHunts.creatorId, userId)));
    return hunt;
  }

  async updateUserHunt(huntId: string, userId: string, updates: Partial<UserCreatedHunt>): Promise<UserCreatedHunt> {
    const [updated] = await db.update(userCreatedHunts)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(and(eq(userCreatedHunts.id, huntId), eq(userCreatedHunts.creatorId, userId)))
      .returning();
    return updated;
  }

  async deleteUserHunt(huntId: string, userId: string): Promise<void> {
    await db.delete(userCreatedHunts)
      .where(and(eq(userCreatedHunts.id, huntId), eq(userCreatedHunts.creatorId, userId)));
  }

  async getUserHuntByInviteCode(inviteCode: string): Promise<UserCreatedHunt | undefined> {
    const [hunt] = await db.select().from(userCreatedHunts)
      .where(eq(userCreatedHunts.inviteCode, inviteCode));
    return hunt;
  }

  // User-created clue operations
  async createUserClue(clue: InsertUserCreatedClue): Promise<UserCreatedClue> {
    const [createdClue] = await db.insert(userCreatedClues).values(clue).returning();
    return createdClue;
  }

  async getUserClue(clueId: string): Promise<UserCreatedClue | undefined> {
    const [clue] = await db.select().from(userCreatedClues).where(eq(userCreatedClues.id, clueId));
    return clue;
  }

  async getUserCluesByHuntId(huntId: string): Promise<UserCreatedClue[]> {
    return await db.select().from(userCreatedClues)
      .where(eq(userCreatedClues.huntId, huntId))
      .orderBy(asc(userCreatedClues.order));
  }

  async updateUserClue(clueId: string, updates: Partial<UserCreatedClue>): Promise<UserCreatedClue> {
    const [updated] = await db.update(userCreatedClues)
      .set(updates)
      .where(eq(userCreatedClues.id, clueId))
      .returning();
    return updated;
  }

  async deleteUserClue(clueId: string): Promise<void> {
    await db.delete(userCreatedClues)
      .where(eq(userCreatedClues.id, clueId));
  }

  // Hunt invitation operations
  async createHuntInvitation(invitation: InsertHuntInvitation): Promise<HuntInvitation> {
    const [created] = await db.insert(huntInvitations).values(invitation).returning();
    return created;
  }

  async getHuntInvitations(huntId: string): Promise<HuntInvitation[]> {
    return await db.select().from(huntInvitations)
      .where(eq(huntInvitations.huntId, huntId))
      .orderBy(desc(huntInvitations.createdAt));
  }

  async getUserInvitations(userId: string): Promise<(HuntInvitation & { hunt: UserCreatedHunt })[]> {
    return await db.select({
      id: huntInvitations.id,
      huntId: huntInvitations.huntId,
      invitedUserId: huntInvitations.invitedUserId,
      invitedEmail: huntInvitations.invitedEmail,
      inviteToken: huntInvitations.inviteToken,
      status: huntInvitations.status,
      createdAt: huntInvitations.createdAt,
      respondedAt: huntInvitations.respondedAt,
      hunt: userCreatedHunts
    })
    .from(huntInvitations)
    .innerJoin(userCreatedHunts, eq(huntInvitations.huntId, userCreatedHunts.id))
    .where(eq(huntInvitations.invitedUserId, userId))
    .orderBy(desc(huntInvitations.createdAt));
  }

  async respondToInvitation(inviteToken: string, userId: string, status: 'accepted' | 'declined'): Promise<HuntInvitation> {
    const [updated] = await db.update(huntInvitations)
      .set({ status, respondedAt: sql`NOW()` })
      .where(and(eq(huntInvitations.inviteToken, inviteToken), eq(huntInvitations.invitedUserId, userId)))
      .returning();
    return updated;
  }

  // Hunt session operations
  async createHuntSession(session: InsertHuntSession): Promise<HuntSession> {
    const [created] = await db.insert(huntSessions).values(session).returning();
    return created;
  }

  async getHuntSession(sessionId: string): Promise<HuntSession | undefined> {
    const [session] = await db.select().from(huntSessions)
      .where(eq(huntSessions.id, sessionId));
    return session;
  }

  async getHuntSessionByCode(sessionCode: string): Promise<HuntSession | undefined> {
    const [session] = await db.select().from(huntSessions)
      .where(eq(huntSessions.sessionCode, sessionCode));
    return session;
  }

  async updateHuntSession(sessionId: string, updates: Partial<HuntSession>): Promise<HuntSession> {
    const [updated] = await db.update(huntSessions)
      .set(updates)
      .where(eq(huntSessions.id, sessionId))
      .returning();
    return updated;
  }

  // Hunt participant operations
  async addHuntParticipant(participant: InsertHuntParticipant): Promise<HuntParticipant> {
    const [added] = await db.insert(huntParticipants).values(participant).returning();
    return added;
  }

  async getSessionParticipant(sessionId: string, userId: string): Promise<HuntParticipant | undefined> {
    const [participant] = await db.select().from(huntParticipants)
      .where(and(eq(huntParticipants.sessionId, sessionId), eq(huntParticipants.userId, userId)));
    return participant;
  }

  async getSessionParticipants(sessionId: string): Promise<(HuntParticipant & { user: User })[]> {
    return await db.select({
      id: huntParticipants.id,
      sessionId: huntParticipants.sessionId,
      userId: huntParticipants.userId,
      role: huntParticipants.role,
      joinedAt: huntParticipants.joinedAt,
      user: users
    })
    .from(huntParticipants)
    .innerJoin(users, eq(huntParticipants.userId, users.id))
    .where(eq(huntParticipants.sessionId, sessionId))
    .orderBy(asc(huntParticipants.joinedAt));
  }

  async removeHuntParticipant(sessionId: string, userId: string): Promise<void> {
    await db.delete(huntParticipants)
      .where(and(eq(huntParticipants.sessionId, sessionId), eq(huntParticipants.userId, userId)));
  }

  // Hunt session progress operations
  async updateSessionProgress(progress: InsertHuntSessionProgress): Promise<HuntSessionProgress> {
    const [updated] = await db.insert(huntSessionProgress).values(progress).returning();
    return updated;
  }

  async getSessionProgress(sessionId: string): Promise<HuntSessionProgress[]> {
    return await db.select().from(huntSessionProgress)
      .where(eq(huntSessionProgress.sessionId, sessionId))
      .orderBy(asc(huntSessionProgress.createdAt));
  }

  async getClueAttempt(userId: string, huntId: string, clueId: string): Promise<ClueAttempt | undefined> {
    const [attempt] = await db.select().from(clueAttempts)
      .where(and(
        eq(clueAttempts.userId, userId),
        eq(clueAttempts.huntId, huntId),
        eq(clueAttempts.clueId, clueId)
      ));
    return attempt;
  }

  async incrementClueAttempt(userId: string, huntId: string, clueId: string): Promise<ClueAttempt> {
    const existingAttempt = await this.getClueAttempt(userId, huntId, clueId);
    
    if (existingAttempt) {
      const [updated] = await db.update(clueAttempts)
        .set({ 
          incorrectAttempts: existingAttempt.incorrectAttempts + 1,
          updatedAt: new Date()
        })
        .where(eq(clueAttempts.id, existingAttempt.id))
        .returning();
      return updated;
    } else {
      const [newAttempt] = await db.insert(clueAttempts)
        .values({
          userId,
          huntId,
          clueId,
          incorrectAttempts: 1
        })
        .returning();
      return newAttempt;
    }
  }

  async markHintViewed(userId: string, huntId: string, clueId: string): Promise<ClueAttempt> {
    const attempt = await this.getClueAttempt(userId, huntId, clueId);
    
    if (!attempt) {
      const [newAttempt] = await db.insert(clueAttempts)
        .values({
          userId,
          huntId,
          clueId,
          hintViewed: true
        })
        .returning();
      return newAttempt;
    }
    
    const [updated] = await db.update(clueAttempts)
      .set({ 
        hintViewed: true,
        updatedAt: new Date()
      })
      .where(eq(clueAttempts.id, attempt.id))
      .returning();
    return updated;
  }

  async bypassClue(userId: string, huntId: string, clueId: string): Promise<ClueAttempt> {
    const attempt = await this.getClueAttempt(userId, huntId, clueId);
    
    if (!attempt) {
      const [newAttempt] = await db.insert(clueAttempts)
        .values({
          userId,
          huntId,
          clueId,
          bypassed: true
        })
        .returning();
      return newAttempt;
    }
    
    const [updated] = await db.update(clueAttempts)
      .set({ 
        bypassed: true,
        updatedAt: new Date()
      })
      .where(eq(clueAttempts.id, attempt.id))
      .returning();
    return updated;
  }

  async seedDatabase(): Promise<void> {
    // Check if data already exists
    const existingHunts = await db.select().from(hunts).limit(1);
    if (existingHunts.length > 0) {
      return; // Data already seeded
    }

    // Create test user
    const testUser = await this.createUser({
      name: "Test User",
      email: "test@example.com",
      password: "Test1234",
    });

    // Create free hunt
    const freeHunt = await this.createHunt({
      title: "Nairobi Heritage Trail",
      description: "Discover Kenya's rich history through iconic landmarks in downtown Nairobi. From the National Archives to Tom Mboya Monument.",
      difficulty: "easy",
      category: "History",
      startCoordinates: "-1.2921,36.8219",
      durationMinutes: 45,
      coverImageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      price: "0.00",
    });

    // Create paid hunt
    const paidHunt = await this.createHunt({
      title: "Ancient Kingdoms Quest",
      description: "Journey through the remnants of great African civilizations and uncover stories of ancient rulers and trading empires.",
      difficulty: "hard",
      category: "Cultural Heritage",
      startCoordinates: "-20.1619,28.5894",
      durationMinutes: 90,
      coverImageUrl: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      price: "2.99",
    });

    // Create additional hunts for different categories
    await this.createHunt({
      title: "Marrakech Food Discovery",
      description: "Taste authentic Moroccan cuisine while exploring the vibrant souks and hidden culinary gems of Marrakech.",
      difficulty: "medium",
      category: "Food",
      startCoordinates: "31.6295,7.9811",
      durationMinutes: 60,
      coverImageUrl: "https://images.unsplash.com/photo-1539650116574-75c0c6d7e9ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      price: "1.99",
    });

    await this.createHunt({
      title: "Cape Town Art Walk",
      description: "Discover street art, galleries, and creative spaces in the Mother City's most artistic neighborhoods.",
      difficulty: "easy",
      category: "Art",
      startCoordinates: "-33.9249,18.4241",
      durationMinutes: 75,
      coverImageUrl: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
      price: "0.00",
    });

    // Create clues for free hunt
    await this.createClue({
      huntId: freeHunt.id,
      clueText: "Start your journey into Kenya's past here, in the heart of the city, at the grand building that holds our nation's memories. It's a place where history is kept alive. Go inside the main entrance. Once inside, find the statue of a man with an iconic fly-whisk, the first President of Kenya. What is the date on the plaque beneath his statue?",
      order: 1,
      locationHint: "Kenya National Archives",
      answer: "20-10-1952",
      points: 100,
      coordinates: "-1.2864,36.8172",
      imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    });

    await this.createClue({
      huntId: freeHunt.id,
      clueText: "Walk a short distance down Moi Avenue. You will see a monument with a statue of a charismatic leader, his arm outstretched. This is where he was tragically assassinated. Stand in front of the monument. Read the plaque on the base of the statue. What year did Tom Mboya die?",
      order: 2,
      locationHint: "Tom Mboya Monument, Moi Avenue",
      answer: "1969",
      points: 100,
      coordinates: "-1.2873,36.8167",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    });

    await this.createClue({
      huntId: freeHunt.id,
      clueText: "This historic library, with its grand architecture and clock tower, is a monument to a different time. Its name is a link to Kenya's colonial past. Step inside and feel the silence of history. Enter the library's main hall. Look up at the walls. You'll see plaques with the names of famous Kenyan and international authors. Find the plaque dedicated to Chinua Achebe. What is the title of his famous book mentioned on the plaque?",
      order: 3,
      locationHint: "McMillan Library",
      answer: "Things Fall Apart",
      points: 100,
      coordinates: "-1.2846,36.8141",
      imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    });

    await this.createClue({
      huntId: freeHunt.id,
      clueText: "Find the large, imposing building on the corner of Moi Avenue and Haile Selassie Avenue. It's a unique architectural gem with a distinct red roof. This building has a fascinating past tied to the 'Kipande' identity card system. Stand across the street from Kipande House. Look up at the building's facade. How many large arched windows are visible on the ground floor facing Moi Avenue?",
      order: 4,
      locationHint: "Kipande House, Moi Avenue",
      answer: "7",
      points: 100,
      coordinates: "-1.2891,36.8211",
      imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    });

    // Create clues for paid hunt
    await this.createClue({
      huntId: paidHunt.id,
      clueText: "Begin your journey at the ancient stone walls that once protected a great trading empire. These ruins tell the story of a civilization that controlled gold and ivory trade routes across Africa.",
      order: 1,
      locationHint: "Great Zimbabwe Ruins",
      answer: "14th century",
      points: 150,
      coordinates: "-20.2677,30.9340",
      imageUrl: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    });

    // Create badge system data
    await db.insert(badges).values([
      {
        name: "Heritage Explorer",
        description: "Complete 2 hunts in the History category to unlock this badge",
        criteria: { type: "category_completion", category: "History", count: 2 }
      },
      {
        name: "Navigator",
        description: "Successfully finish a Hard difficulty hunt",
        criteria: { type: "difficulty_completion", difficulty: "Hard", count: 1 }
      },
      {
        name: "Speed Hunter",
        description: "Achieve the fastest completion time overall",
        criteria: { type: "fastest_completion" }
      },
      {
        name: "Culture Enthusiast",
        description: "Complete 2 hunts in the Cultural Heritage category",
        criteria: { type: "category_completion", category: "Cultural Heritage", count: 2 }
      },
      {
        name: "Adventure Master",
        description: "Complete the most hunts overall",
        criteria: { type: "most_completions" }
      }
    ]);

    console.log("Database seeded successfully!");
  }
}

export const storage = new DatabaseStorage();
