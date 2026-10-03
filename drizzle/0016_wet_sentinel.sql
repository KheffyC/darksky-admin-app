CREATE TABLE "EventFile" (
	"id" text PRIMARY KEY NOT NULL,
	"eventId" text NOT NULL,
	"label" text NOT NULL,
	"path" text NOT NULL,
	"createdBy" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Event" (
	"id" text PRIMARY KEY NOT NULL,
	"season" text NOT NULL,
	"type" text DEFAULT 'show' NOT NULL,
	"title" text NOT NULL,
	"date" date NOT NULL,
	"startTime" text,
	"endTime" text,
	"location" text,
	"address" text,
	"notes" text,
	"schedule" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pocName" text,
	"pocRole" text,
	"pocPhone" text,
	"driverName" text,
	"driverFee" numeric(10, 2),
	"trailerNotes" text,
	"createdBy" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Link" ADD COLUMN "eventId" text;--> statement-breakpoint
ALTER TABLE "EventFile" ADD CONSTRAINT "EventFile_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EventFile" ADD CONSTRAINT "EventFile_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "EventFile_eventId_idx" ON "EventFile" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "Event_season_date_idx" ON "Event" USING btree ("season","date");--> statement-breakpoint
ALTER TABLE "Link" ADD CONSTRAINT "Link_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE set null ON UPDATE cascade;