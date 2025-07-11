import { pgTable, varchar, timestamp, text, integer, uniqueIndex, doublePrecision, boolean, foreignKey, date, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from 'drizzle-orm';

export const prismaMigrations = pgTable("_prisma_migrations", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp("rolled_back_at", { withTimezone: true, mode: 'string' }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const members = pgTable("Member", {
	id: text().primaryKey().notNull(),
	firstName: text().notNull(),
	lastName: text().notNull(),
	legalName: text(), // Full legal name if different
	email: text().notNull(),
	phone: text(),
	parentEmail: text(), // Parent/Cosigner Email
	parentPhone: text(), // Parent/Cosigner Phone
	address: text(), // Physical address
	section: text(),
	season: text().notNull(),
	tuitionAmount: doublePrecision().default(1000).notNull(),
	contractSigned: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	// Jotform integration fields
	birthday: date(),
	age: integer(),
	jotformSubmissionId: text(),
	source: text().default('manual').notNull(), // 'manual' | 'jotform'
	// Instrument fields
	instrument: text(),
	serialNumber: text(),
}, (table) => [
	uniqueIndex("Member_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("Member_jotformSubmissionId_key").using("btree", table.jotformSubmissionId.asc().nullsLast().op("text_ops")),
]);

export const tuitionEditLogs = pgTable("TuitionEditLog", {
	id: text().primaryKey().notNull(),
	memberId: text().notNull(),
	oldAmount: integer().notNull(),
	newAmount: integer().notNull(),
	editedBy: text().notNull(),
	editedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.memberId],
			foreignColumns: [members.id],
			name: "TuitionEditLog_memberId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const paymentSchedules = pgTable("PaymentSchedule", {
	id: text().primaryKey().notNull(),
	name: text().notNull(), // e.g., "Fall 2024", "Spring 2025"
	description: text(), // Optional description
	dueDate: date().notNull(), // When payment is due
	amount: decimal({ precision: 10, scale: 2 }).notNull(), // Amount due
	season: text().notNull(), // Season this schedule applies to
	isActive: boolean().default(true).notNull(), // Can be deactivated
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const integrationSettings = pgTable("IntegrationSettings", {
	id: text().primaryKey().notNull(),
	jotformApiKey: text(),
	jotformFormId: text(),
	fieldMapping: text(), // JSON string for field mappings
	lastSyncDate: timestamp({ precision: 3, mode: 'string' }),
	isActive: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const importLogs = pgTable("ImportLog", {
	id: text().primaryKey().notNull(),
	source: text().notNull(), // 'jotform'
	status: text().notNull(), // 'success' | 'error' | 'partial'
	membersImported: integer().default(0).notNull(),
	errorsCount: integer().default(0).notNull(),
	errorDetails: text(), // JSON string with error details
	startedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	completedAt: timestamp({ precision: 3, mode: 'string' }),
	triggeredBy: text(), // user who triggered the import
});

export const settings = pgTable("Settings", {
	id: text().primaryKey().notNull(),
	organizationName: text().notNull(),
	season: text().notNull(),
	defaultTuition: doublePrecision().default(1000).notNull(),
	paymentDueDate: text(),
	emailNotifications: boolean().default(true).notNull(),
	autoReconcile: boolean().default(false).notNull(),
	currentSeason: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("Settings_season_key").using("btree", table.season.asc().nullsLast().op("text_ops")),
]);

export const unmatchedPayments = pgTable("UnmatchedPayment", {
	id: text().primaryKey().notNull(),
	stripePaymentId: text(),
	amountPaid: doublePrecision().notNull(),
	paymentDate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	cardLast4: text(),
	customerName: text(),
	notes: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	paymentMethod: text().default('card').notNull(),
	scheduleId: text(),
}, (table) => [
	uniqueIndex("UnmatchedPayment_stripePaymentId_key").using("btree", table.stripePaymentId.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.scheduleId],
		foreignColumns: [paymentSchedules.id],
		name: "UnmatchedPayment_scheduleId_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

export const payments = pgTable("Payment", {
	id: text().primaryKey().notNull(),
	memberId: text().notNull(),
	amountPaid: doublePrecision().notNull(),
	paymentMethod: text().notNull(),
	stripePaymentId: text(),
	paymentDate: timestamp({ precision: 3, mode: 'string' }).notNull(),
	note: text(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	cardLast4: text(),
	customerName: text(),
	scheduleId: text(),
	isLate: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.memberId],
			foreignColumns: [members.id],
			name: "Payment_memberId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
		columns: [table.scheduleId],
		foreignColumns: [paymentSchedules.id],
		name: "Payment_scheduleId_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

// Authentication Tables
export const users = pgTable("User", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text().notNull(),
	firstName: text().notNull(),
	lastName: text().notNull(),
	role: text().default('member').notNull(), // 'admin' | 'director' | 'member'
	isActive: boolean().default(true).notNull(),
	lastLoginAt: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const userPermissions = pgTable("UserPermission", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	permission: text().notNull(),
	grantedBy: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "UserPermission_userId_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.grantedBy],
		foreignColumns: [users.id],
		name: "UserPermission_grantedBy_fkey"
	}).onUpdate("cascade").onDelete("restrict"),
]);

export const userSessions = pgTable("UserSession", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "UserSession_userId_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

// Relations
export const membersRelations = relations(members, ({ many }) => ({
  payments: many(payments),
  tuitionEdits: many(tuitionEditLogs),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  schedule: one(paymentSchedules, {
    fields: [payments.scheduleId],
    references: [paymentSchedules.id],
  }),
}));

export const unmatchedPaymentsRelations = relations(unmatchedPayments, ({ one }) => ({
  schedule: one(paymentSchedules, {
    fields: [unmatchedPayments.scheduleId],
    references: [paymentSchedules.id],
  }),
}));

export const tuitionEditLogsRelations = relations(tuitionEditLogs, ({ one }) => ({
  member: one(members, {
    fields: [tuitionEditLogs.memberId],
    references: [members.id],
  }),
}));

export const paymentSchedulesRelations = relations(paymentSchedules, ({ many }) => ({
  payments: many(payments),
  unmatchedPayments: many(unmatchedPayments),
}));

// User Relations
export const usersRelations = relations(users, ({ many }) => ({
  permissions: many(userPermissions, { relationName: "UserPermissions" }),
  grantedPermissions: many(userPermissions, { relationName: "GrantedPermissions" }),
  sessions: many(userSessions),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
    relationName: "UserPermissions",
  }),
  grantedBy: one(users, {
    fields: [userPermissions.grantedBy],
    references: [users.id],
    relationName: "GrantedPermissions",
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// Export types
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type UnmatchedPayment = typeof unmatchedPayments.$inferSelect;
export type NewUnmatchedPayment = typeof unmatchedPayments.$inferInsert;
export type TuitionEditLog = typeof tuitionEditLogs.$inferSelect;
export type NewTuitionEditLog = typeof tuitionEditLogs.$inferInsert;
export type PaymentSchedule = typeof paymentSchedules.$inferSelect;
export type NewPaymentSchedule = typeof paymentSchedules.$inferInsert;
export type IntegrationSettings = typeof integrationSettings.$inferSelect;
export type NewIntegrationSettings = typeof integrationSettings.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type ImportLog = typeof importLogs.$inferSelect;
export type NewImportLog = typeof importLogs.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
