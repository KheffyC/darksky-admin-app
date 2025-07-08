CREATE TABLE "ImportLog" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"membersImported" integer DEFAULT 0 NOT NULL,
	"errorsCount" integer DEFAULT 0 NOT NULL,
	"errorDetails" text,
	"startedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completedAt" timestamp(3),
	"triggeredBy" text
);
--> statement-breakpoint
CREATE TABLE "IntegrationSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"jotformApiKey" text,
	"jotformFormId" text,
	"fieldMapping" text,
	"lastSyncDate" timestamp(3),
	"isActive" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Member" ADD COLUMN "birthday" date;--> statement-breakpoint
ALTER TABLE "Member" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "Member" ADD COLUMN "jotformSubmissionId" text;--> statement-breakpoint
ALTER TABLE "Member" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "Member_jotformSubmissionId_key" ON "Member" USING btree ("jotformSubmissionId" text_ops);