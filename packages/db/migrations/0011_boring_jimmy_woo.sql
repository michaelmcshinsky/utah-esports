ALTER TABLE "event_series" ADD COLUMN "state" text DEFAULT 'UT' NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_sources" ADD COLUMN "state" text DEFAULT 'UT' NOT NULL;--> statement-breakpoint
ALTER TABLE "event_submissions" ADD COLUMN "state" text DEFAULT 'UT' NOT NULL;