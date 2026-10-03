CREATE TABLE "CalendarSource" (
	"id" text PRIMARY KEY NOT NULL,
	"icsUrl" text NOT NULL,
	"lastSyncedAt" timestamp(3),
	"lastStatus" text,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "externalUid" text;--> statement-breakpoint
ALTER TABLE "Event" ADD COLUMN "removedFromSource" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "Event_externalUid_key" ON "Event" USING btree ("externalUid" text_ops);