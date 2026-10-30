ALTER TABLE "communities" ADD COLUMN "state" text DEFAULT 'UT' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "state" text DEFAULT 'UT' NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "state" text DEFAULT 'UT' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD COLUMN "state" text DEFAULT 'UT' NOT NULL;