ALTER TABLE "Settings" ADD COLUMN "currentSeason" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "Settings_season_key" ON "Settings" USING btree ("season" text_ops);