import { pgTable, varchar, timestamp, text, integer, uniqueIndex, doublePrecision, boolean, foreignKey, date, decimal, index, jsonb } from "drizzle-orm/pg-core";
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
	mailingAddress: text(), // Only set when different from physical address
	school: text(), // School attending, if applicable
	section: text(),
	season: text().notNull(),
	tuitionAmount: doublePrecision().default(1000).notNull(),
	contractSigned: boolean().default(false).notNull(),
	// Completed seasons with the ensemble before this one; drives the vet discount
	previousSeasons: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	isActive: boolean().default(true).notNull(),
	// Jotform integration fields
	birthday: date(),
	age: integer(),
	jotformSubmissionId: text(),
	source: text().default('manual').notNull(), // 'manual' | 'jotform'
	// Instrument fields
	instrument: text(),
	serialNumber: text(),
}, (table) => [
	// A person has one member record per season; returners get a new record each season
	uniqueIndex("Member_email_season_key").using("btree", table.email.asc().nullsLast().op("text_ops"), table.season.asc().nullsLast().op("text_ops")),
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
	vetDiscount: doublePrecision().default(100).notNull(), // Tuition discount per completed prior season
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
	memberName: text(),
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

// One row per device that turned on push notifications
export const pushSubscriptions = pgTable("PushSubscription", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	endpoint: text().notNull(),
	p256dh: text().notNull(),
	auth: text().notNull(),
	userAgent: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("PushSubscription_endpoint_key").using("btree", table.endpoint.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "PushSubscription_userId_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
]);

// Shortcuts into the Google Drive hub, grouped by category per season
export const links = pgTable("Link", {
	id: text().primaryKey().notNull(),
	season: text().notNull(),
	title: text().notNull(),
	url: text().notNull(),
	category: text().notNull(), // free-form, e.g. 'Season contracts'
	pinned: boolean().default(false).notNull(),
	eventId: text(), // also shown on that event's page (e.g. a show packet)
	createdBy: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "Link_createdBy_fkey"
	}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
		columns: [table.eventId],
		foreignColumns: [events.id],
		name: "Link_eventId_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

// Out-of-pocket purchases one of the admins needs paid back
export const reimbursements = pgTable("Reimbursement", {
	id: text().primaryKey().notNull(),
	season: text().notNull(),
	paidBy: text().notNull(), // User who spent their own money
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	description: text().notNull(),
	purchasedOn: date().notNull(),
	receiptPath: text(), // Private Vercel Blob pathname, served through /api/files
	status: text().default('owed').notNull(), // 'owed' | 'reimbursed'
	reimbursedOn: date(),
	reimbursedMethod: text(), // e.g. 'Venmo', 'Check'
	createdBy: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.paidBy],
		foreignColumns: [users.id],
		name: "Reimbursement_paidBy_fkey"
	}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "Reimbursement_createdBy_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

// Season projects; archived ones drop off the main list
export const projects = pgTable("Project", {
	id: text().primaryKey().notNull(),
	season: text().notNull(),
	name: text().notNull(),
	description: text(),
	status: text().default('active').notNull(), // 'active' | 'archived'
	createdBy: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("Project_season_idx").on(table.season),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "Project_createdBy_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

// A task belongs to a project and takes its season from it
export const tasks = pgTable("Task", {
	id: text().primaryKey().notNull(),
	projectId: text().notNull(),
	title: text().notNull(),
	details: text(),
	ownerId: text(),
	dueDate: date(),
	completedAt: timestamp({ precision: 3, mode: 'string' }),
	completedBy: text(),
	createdBy: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("Task_projectId_idx").on(table.projectId),
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "Task_projectId_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.ownerId],
		foreignColumns: [users.id],
		name: "Task_ownerId_fkey"
	}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
		columns: [table.completedBy],
		foreignColumns: [users.id],
		name: "Task_completedBy_fkey"
	}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "Task_createdBy_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

// A shared note is a thread of short entries ("Things to discuss this week")
export const notes = pgTable("Note", {
	id: text().primaryKey().notNull(),
	season: text().notNull(),
	title: text().notNull(),
	pinned: boolean().default(false).notNull(),
	createdBy: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(), // bumped when an entry is added
}, (table) => [
	index("Note_season_idx").on(table.season),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "Note_createdBy_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

export const noteEntries = pgTable("NoteEntry", {
	id: text().primaryKey().notNull(),
	noteId: text().notNull(),
	authorId: text(),
	body: text().notNull(),
	taskId: text(), // set when the entry was turned into a task
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	editedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	index("NoteEntry_noteId_idx").on(table.noteId),
	foreignKey({
		columns: [table.noteId],
		foreignColumns: [notes.id],
		name: "NoteEntry_noteId_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.authorId],
		foreignColumns: [users.id],
		name: "NoteEntry_authorId_fkey"
	}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
		columns: [table.taskId],
		foreignColumns: [tasks.id],
		name: "NoteEntry_taskId_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

// Season calendar: shows, rehearsals, deadlines. Show-day details live on the same row.
export type ScheduleItem = { time: string; label: string };

export const events = pgTable("Event", {
	id: text().primaryKey().notNull(),
	season: text().notNull(),
	type: text().default('show').notNull(), // 'show' | 'rehearsal' | 'deadline' | 'other'
	title: text().notNull(),
	date: date().notNull(),
	startTime: text(), // 'HH:MM' 24-hour
	endTime: text(),
	location: text(), // venue name
	address: text(),
	notes: text(),
	schedule: jsonb().$type<ScheduleItem[]>().default([]).notNull(), // day-of timeline
	pocName: text(), // point of contact at the show site
	pocRole: text(),
	pocPhone: text(),
	driverName: text(),
	driverFee: decimal({ precision: 10, scale: 2 }),
	trailerNotes: text(), // route, parking, unload door
	source: text().default('manual').notNull(), // 'manual' | 'linked' (imported from the linked calendar)
	externalUid: text(), // iCal UID (plus occurrence start for repeating events)
	removedFromSource: boolean().default(false).notNull(), // deleted in the linked calendar but kept for its show-day details
	createdBy: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("Event_season_date_idx").on(table.season, table.date),
	uniqueIndex("Event_externalUid_key").using("btree", table.externalUid.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "Event_createdBy_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

// Maps, diagrams, and other files attached to an event
export const eventFiles = pgTable("EventFile", {
	id: text().primaryKey().notNull(),
	eventId: text().notNull(),
	label: text().notNull(),
	path: text().notNull(), // private Vercel Blob pathname
	createdBy: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("EventFile_eventId_idx").on(table.eventId),
	foreignKey({
		columns: [table.eventId],
		foreignColumns: [events.id],
		name: "EventFile_eventId_fkey"
	}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "EventFile_createdBy_fkey"
	}).onUpdate("cascade").onDelete("set null"),
]);

// One row per Pacific-time day the morning digest ran, so it never sends twice
export const digestLogs = pgTable("DigestLog", {
	date: date().primaryKey().notNull(), // Pacific date
	title: text(),
	body: text(),
	sent: integer().default(0).notNull(), // devices it reached; 0 when nothing needed attention
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// A linked external calendar (Google secret address or Apple public link, both iCal) that feeds the season calendar
export const calendarSources = pgTable("CalendarSource", {
	id: text().primaryKey().notNull(), // 'linked'
	icsUrl: text().notNull(),
	lastSyncedAt: timestamp({ precision: 3, mode: 'string' }),
	lastStatus: text(), // summary or error from the last sync
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

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
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type Reimbursement = typeof reimbursements.$inferSelect;
export type NewReimbursement = typeof reimbursements.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteEntry = typeof noteEntries.$inferSelect;
export type NewNoteEntry = typeof noteEntries.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventFile = typeof eventFiles.$inferSelect;
export type NewEventFile = typeof eventFiles.$inferInsert;
export type DigestLog = typeof digestLogs.$inferSelect;
export type CalendarSource = typeof calendarSources.$inferSelect;
