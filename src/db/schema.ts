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
	email: text().notNull(),
	phone: text(),
	section: text(),
	season: text().notNull(),
	tuitionAmount: doublePrecision().default(1000).notNull(),
	contractSigned: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("Member_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
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
