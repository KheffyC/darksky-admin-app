DROP INDEX "Member_email_key";--> statement-breakpoint
ALTER TABLE "Settings" ADD COLUMN "vetDiscount" double precision DEFAULT 100 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "Member_email_season_key" ON "Member" USING btree ("email" text_ops,"season" text_ops);