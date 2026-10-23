CREATE TABLE "catalog_sources" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"city" text,
	"region" text,
	"games" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" text DEFAULT 'unknown' NOT NULL,
	"scrape_adapter" text DEFAULT 'none' NOT NULL,
	"scrape_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"scrape_notes" text,
	"directory_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"directory_imported" boolean DEFAULT false NOT NULL,
	"notes" text,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "catalog_sources_kind_idx" ON "catalog_sources" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "catalog_sources_status_idx" ON "catalog_sources" USING btree ("status");