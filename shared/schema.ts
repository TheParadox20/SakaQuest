import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hunts table
export const hunts = pgTable("hunts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull().default("History"),
  startCoordinates: text("start_coordinates"),
  durationMinutes: integer("duration_minutes").notNull(),
  coverImageUrl: text("cover_image_url").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  isAdminOnly: boolean("is_admin_only").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clues table
export const clues = pgTable("clues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  huntId: varchar("hunt_id").notNull().references(() => hunts.id),
  clueText: text("clue_text").notNull(),
  order: integer("order").notNull(),
  locationHint: text("location_hint"),
  hint: text("hint"),
  answer: text("answer").notNull(),
  points: integer("points").notNull().default(100),
  coordinates: text("coordinates"),
  imageUrl: text("image_url"),
  narrative: text("narrative"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchases table
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  huntId: varchar("hunt_id").notNull().references(() => hunts.id),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  transactionReference: text("transaction_reference").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress table
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  huntId: varchar("hunt_id").notNull().references(() => hunts.id),
  currentClueId: varchar("current_clue_id").references(() => clues.id),
  completed: boolean("completed").notNull().default(false),
  totalPoints: integer("total_points").notNull().default(0),
  completionTimeMinutes: integer("completion_time_minutes"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Badge system tables
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  criteria: jsonb("criteria").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  dateAwarded: timestamp("date_awarded").defaultNow(),
});

export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryName: varchar("category_name").notNull(),
  huntId: varchar("hunt_id").notNull().references(() => hunts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull(), // "monthly" or "yearly"
  status: text("status").notNull().default("active"), // "active", "inactive", "cancelled"
  startDate: timestamp("start_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date").notNull(),
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User-created hunts table
export const userCreatedHunts = pgTable("user_created_hunts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  theme: text("theme"),
  description: text("description"),
  isDraft: boolean("is_draft").notNull().default(true),
  isPublic: boolean("is_public").notNull().default(false),
  status: text("status").notNull().default("draft"), // "draft", "active"
  inviteCode: varchar("invite_code").unique(),
  deploymentPrice: decimal("deployment_price", { precision: 10, scale: 2 }).notNull().default("50.00"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-created clues table
export const userCreatedClues = pgTable("user_created_clues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  huntId: varchar("hunt_id").notNull().references(() => userCreatedHunts.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  clueText: text("clue_text").notNull(),
  narrative: text("narrative"),
  challenge: text("challenge"),
  correctAnswer: text("correct_answer").notNull(),
  hint: text("hint"),
  order: integer("order").notNull(),
  coordinates: text("coordinates"),
  locationHint: text("location_hint"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hunt invitations table
export const huntInvitations = pgTable("hunt_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  huntId: varchar("hunt_id").notNull().references(() => userCreatedHunts.id, { onDelete: 'cascade' }),
  invitedUserId: varchar("invited_user_id").references(() => users.id),
  invitedEmail: text("invited_email"),
  inviteToken: varchar("invite_token").notNull().unique(),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "declined"
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Hunt sessions for multiplayer
export const huntSessions = pgTable("hunt_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  huntId: varchar("hunt_id").notNull().references(() => userCreatedHunts.id, { onDelete: 'cascade' }),
  sessionCode: varchar("session_code").notNull().unique(),
  hostUserId: varchar("host_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("waiting"), // "waiting", "active", "completed", "cancelled"
  currentClueOrder: integer("current_clue_order").notNull().default(1),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hunt participants table
export const huntParticipants = pgTable("hunt_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => huntSessions.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("participant"), // "host", "participant"
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Hunt session progress table
export const huntSessionProgress = pgTable("hunt_session_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => huntSessions.id, { onDelete: 'cascade' }),
  clueId: varchar("clue_id").notNull().references(() => userCreatedClues.id),
  solvedBy: varchar("solved_by").references(() => users.id),
  answer: text("answer"),
  isSolved: boolean("is_solved").notNull().default(false),
  solvedAt: timestamp("solved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clue attempts tracking table
export const clueAttempts = pgTable("clue_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  huntId: varchar("hunt_id").notNull(),
  clueId: varchar("clue_id").notNull(),
  incorrectAttempts: integer("incorrect_attempts").notNull().default(0),
  hintViewed: boolean("hint_viewed").notNull().default(false),
  bypassed: boolean("bypassed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(purchases),
  progress: many(userProgress),
  badges: many(userBadges),
  subscriptions: many(subscriptions),
  createdHunts: many(userCreatedHunts),
  huntInvitations: many(huntInvitations),
  hostedSessions: many(huntSessions),
  sessionParticipations: many(huntParticipants),
}));

export const huntsRelations = relations(hunts, ({ many }) => ({
  clues: many(clues),
  purchases: many(purchases),
  progress: many(userProgress),
  collections: many(collections),
}));

export const cluesRelations = relations(clues, ({ one }) => ({
  hunt: one(hunts, {
    fields: [clues.huntId],
    references: [hunts.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  hunt: one(hunts, {
    fields: [purchases.huntId],
    references: [hunts.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  hunt: one(hunts, {
    fields: [userProgress.huntId],
    references: [hunts.id],
  }),
  currentClue: one(clues, {
    fields: [userProgress.currentClueId],
    references: [clues.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one }) => ({
  hunt: one(hunts, {
    fields: [collections.huntId],
    references: [hunts.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const userCreatedHuntsRelations = relations(userCreatedHunts, ({ one, many }) => ({
  creator: one(users, {
    fields: [userCreatedHunts.creatorId],
    references: [users.id],
  }),
  clues: many(userCreatedClues),
  invitations: many(huntInvitations),
  sessions: many(huntSessions),
}));

export const userCreatedCluesRelations = relations(userCreatedClues, ({ one }) => ({
  hunt: one(userCreatedHunts, {
    fields: [userCreatedClues.huntId],
    references: [userCreatedHunts.id],
  }),
}));

export const huntInvitationsRelations = relations(huntInvitations, ({ one }) => ({
  hunt: one(userCreatedHunts, {
    fields: [huntInvitations.huntId],
    references: [userCreatedHunts.id],
  }),
  invitedUser: one(users, {
    fields: [huntInvitations.invitedUserId],
    references: [users.id],
  }),
}));

export const huntSessionsRelations = relations(huntSessions, ({ one, many }) => ({
  hunt: one(userCreatedHunts, {
    fields: [huntSessions.huntId],
    references: [userCreatedHunts.id],
  }),
  host: one(users, {
    fields: [huntSessions.hostUserId],
    references: [users.id],
  }),
  participants: many(huntParticipants),
  progress: many(huntSessionProgress),
}));

export const huntParticipantsRelations = relations(huntParticipants, ({ one }) => ({
  session: one(huntSessions, {
    fields: [huntParticipants.sessionId],
    references: [huntSessions.id],
  }),
  user: one(users, {
    fields: [huntParticipants.userId],
    references: [users.id],
  }),
}));

export const huntSessionProgressRelations = relations(huntSessionProgress, ({ one }) => ({
  session: one(huntSessions, {
    fields: [huntSessionProgress.sessionId],
    references: [huntSessions.id],
  }),
  clue: one(userCreatedClues, {
    fields: [huntSessionProgress.clueId],
    references: [userCreatedClues.id],
  }),
  solver: one(users, {
    fields: [huntSessionProgress.solvedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertHuntSchema = createInsertSchema(hunts).omit({
  id: true,
  createdAt: true,
});

export const insertClueSchema = createInsertSchema(clues).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  dateAwarded: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const insertUserCreatedHuntSchema = createInsertSchema(userCreatedHunts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCreatedClueSchema = createInsertSchema(userCreatedClues).omit({
  id: true,
  createdAt: true,
});

export const insertHuntInvitationSchema = createInsertSchema(huntInvitations).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export const insertHuntSessionSchema = createInsertSchema(huntSessions).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertHuntParticipantSchema = createInsertSchema(huntParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertHuntSessionProgressSchema = createInsertSchema(huntSessionProgress).omit({
  id: true,
  createdAt: true,
  solvedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Hunt = typeof hunts.$inferSelect;
export type InsertHunt = z.infer<typeof insertHuntSchema>;
export type Clue = typeof clues.$inferSelect;
export type InsertClue = z.infer<typeof insertClueSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type UserCreatedHunt = typeof userCreatedHunts.$inferSelect;
export type InsertUserCreatedHunt = z.infer<typeof insertUserCreatedHuntSchema>;
export type UserCreatedClue = typeof userCreatedClues.$inferSelect;
export type InsertUserCreatedClue = z.infer<typeof insertUserCreatedClueSchema>;
export type HuntInvitation = typeof huntInvitations.$inferSelect;
export type InsertHuntInvitation = z.infer<typeof insertHuntInvitationSchema>;
export type HuntSession = typeof huntSessions.$inferSelect;
export type InsertHuntSession = z.infer<typeof insertHuntSessionSchema>;
export type HuntParticipant = typeof huntParticipants.$inferSelect;
export type InsertHuntParticipant = z.infer<typeof insertHuntParticipantSchema>;
export type HuntSessionProgress = typeof huntSessionProgress.$inferSelect;
export type InsertHuntSessionProgress = z.infer<typeof insertHuntSessionProgressSchema>;
export type ClueAttempt = typeof clueAttempts.$inferSelect;
export const insertClueAttemptSchema = createInsertSchema(clueAttempts);
export type InsertClueAttempt = z.infer<typeof insertClueAttemptSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const updatePasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

// Payment schemas
export const paymentInitSchema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
  huntId: z.string(),
});

export const subscriptionInitSchema = z.object({
  email: z.string().email(),
  plan: z.enum(["monthly", "yearly"]),
});

export const paymentVerifySchema = z.object({
  reference: z.string(),
});

export const deploymentPaymentSchema = z.object({
  email: z.string().email(),
  huntId: z.string(),
  amount: z.number().positive(),
});

// User-created hunt validation schemas
// Only require fields the frontend should send - backend will add creatorId, inviteCode
export const createUserHuntSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters"),
  theme: z.string().optional(),
  description: z.string().optional(),
  isDraft: z.boolean().optional().default(true),
  isPublic: z.boolean().optional().default(false),
  status: z.string().optional().default("draft"),
  deploymentPrice: z.string().optional().default("50.00"),
  deployedAt: z.date().optional().nullable(),
});

export const updateUserHuntSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters").optional(),
  theme: z.string().optional(),
  description: z.string().optional(),
  isDraft: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// Only require fields the frontend should send - backend will add huntId from URL
export const createUserClueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clueText: z.string().min(1, "Clue text is required"),
  narrative: z.string().optional(),
  challenge: z.string().optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  locationHint: z.string().optional(),
  coordinates: z.string().optional(),
  order: z.number().int().min(1, "Order must be at least 1"),
});

export const updateUserClueSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters").optional(),
  clueText: z.string().min(1, "Clue text is required").optional(),
  narrative: z.string().optional(),
  challenge: z.string().optional(),
  correctAnswer: z.string().min(1, "Correct answer is required").optional(),
  order: z.number().int().min(1, "Order must be at least 1").optional(),
  coordinates: z.string().optional(),
  locationHint: z.string().optional(),
});

export const createHuntInvitationSchema = z.object({
  invitedEmail: z.string().email("Valid email is required"),
});

export const respondToInvitationSchema = z.object({
  status: z.enum(["accepted", "declined"], {
    required_error: "Status is required",
    invalid_type_error: "Status must be 'accepted' or 'declined'",
  }),
});

export const updateSessionProgressSchema = z.object({
  clueId: z.string().min(1, "Clue ID is required"),
  answer: z.string().optional(),
  isSolved: z.boolean(),
});
