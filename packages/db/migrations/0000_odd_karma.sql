CREATE TYPE "public"."age_policy" AS ENUM('all_ages', 'teen', '18_plus', '21_plus', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."entry_mode" AS ENUM('individual', 'team', 'either');--> statement-breakpoint
CREATE TYPE "public"."event_format" AS ENUM('in_person', 'online', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'postponed', 'cancelled', 'completed', 'needs_verification', 'archived');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('tournament', 'casual', 'watch_party', 'workshop', 'tryout', 'league', 'other');--> statement-breakpoint
CREATE TYPE "public"."follow_kind" AS ENUM('game', 'community', 'organization', 'venue');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('published', 'needs_verification', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'discord');--> statement-breakpoint
CREATE TYPE "public"."org_kind" AS ENUM('community', 'venue', 'school', 'collegiate', 'youth', 'team', 'organizer', 'other');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('pc', 'playstation', 'xbox', 'switch', 'multi', 'other');--> statement-breakpoint
CREATE TYPE "public"."registration_state" AS ENUM('open', 'closing_soon', 'closed', 'full', 'waitlist', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."school_pathway" AS ENUM('high_school', 'collegiate', 'youth', 'independent_team');--> statement-breakpoint
CREATE TYPE "public"."skill_level" AS ENUM('beginner_friendly', 'open', 'intermediate', 'advanced', 'competitive', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('organizer', 'startgg', 'legacy_jekyll', 'import', 'community', 'manual');--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"welcome_text" text,
	"city" text,
	"region" text,
	"primary_url" text,
	"discord_url" text,
	"facebook_url" text,
	"website_url" text,
	"code_of_conduct_url" text,
	"contact_email" text,
	"organization_id" uuid,
	"status" "listing_status" DEFAULT 'published' NOT NULL,
	"source_id" uuid,
	"last_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_games" (
	"community_id" uuid NOT NULL,
	"game_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"family" text,
	"startgg_videogame_id" integer,
	"startgg_videogame_slug" text,
	"icon_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text,
	"city" text,
	"region" text,
	"state" text DEFAULT 'UT' NOT NULL,
	"postal_code" text,
	"lat" double precision,
	"lng" double precision,
	"website_url" text,
	"phone" text,
	"hours" text,
	"equipment_notes" text,
	"byod_required" boolean DEFAULT false NOT NULL,
	"age_policy" "age_policy" DEFAULT 'unknown' NOT NULL,
	"accessibility_notes" text,
	"typical_cost_notes" text,
	"status" "listing_status" DEFAULT 'published' NOT NULL,
	"source_id" uuid,
	"last_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_discord_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"guild_id" text NOT NULL,
	"guild_name" text,
	"announce_channel_id" text,
	"announce_channel_name" text,
	"events_channel_id" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"authorized_by" uuid,
	"bot_joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"proof_url" text NOT NULL,
	"message" text,
	"contact_email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "org_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" "org_kind" DEFAULT 'community' NOT NULL,
	"description" text,
	"website_url" text,
	"contact_email" text NOT NULL,
	"city" text,
	"region" text,
	"claimed_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"role" text DEFAULT 'player' NOT NULL,
	"game_role" text,
	"discord_user_id" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"sort_weight" text
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"pathway" "school_pathway",
	"game_id" uuid,
	"description" text,
	"tryout_info" text,
	"contact_email" text,
	"website_url" text,
	"institution" text,
	"city" text,
	"status" text DEFAULT 'active' NOT NULL,
	"source_id" uuid,
	"last_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_discord_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"discord_user_id" text NOT NULL,
	"discord_username" text,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_field_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"field" text NOT NULL,
	"value" text,
	"source" text NOT NULL,
	"last_observed_at" timestamp with time zone NOT NULL,
	"last_confirmed_at" timestamp with time zone,
	"override_owner" uuid
);
--> statement-breakpoint
CREATE TABLE "event_games" (
	"event_id" uuid NOT NULL,
	"game_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"kind" text DEFAULT 'other' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"series_id" uuid,
	"organization_id" uuid,
	"venue_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"event_type" "event_type" DEFAULT 'casual' NOT NULL,
	"format" "event_format" DEFAULT 'in_person' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"city" text,
	"region" text,
	"lat" double precision,
	"lng" double precision,
	"online_url" text,
	"age_policy" "age_policy" DEFAULT 'unknown' NOT NULL,
	"skill_level" "skill_level" DEFAULT 'unknown' NOT NULL,
	"entry_mode" "entry_mode" DEFAULT 'individual' NOT NULL,
	"platforms" text[] DEFAULT '{}'::text[] NOT NULL,
	"beginner_friendly" boolean DEFAULT false NOT NULL,
	"youth_program" boolean DEFAULT false NOT NULL,
	"price_cents" integer,
	"price_note" text,
	"venue_fee_cents" integer,
	"registration_url" text,
	"registration_state" "registration_state" DEFAULT 'unknown' NOT NULL,
	"registration_deadline" timestamp with time zone,
	"contact_name" text,
	"contact_email" text,
	"bring_notes" text,
	"parking_notes" text,
	"first_time_notes" text,
	"schedule_notes" text,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"status_notice" text,
	"source_id" uuid,
	"source_record_id" uuid,
	"last_observed_at" timestamp with time zone,
	"last_confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"organization_id" uuid,
	"venue_id" uuid,
	"event_type" "event_type" DEFAULT 'casual' NOT NULL,
	"format" "event_format" DEFAULT 'in_person' NOT NULL,
	"description" text,
	"recurrence_hint" text,
	"series_ends_on" date,
	"max_occurrences" integer DEFAULT 52,
	"source_id" uuid,
	"created_by" uuid,
	"status" "event_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "change_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_kind" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"actor" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duplicate_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_kind" text NOT NULL,
	"kept_entity_id" uuid NOT NULL,
	"candidate_entity_id" uuid,
	"candidate_source_record_id" uuid,
	"score" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"entity_kind" text NOT NULL,
	"entity_id" uuid,
	"url" text,
	"payload" jsonb,
	"content_hash" text,
	"status" text DEFAULT 'active' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"missing_since" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"kind" "source_kind" NOT NULL,
	"name" text NOT NULL,
	"homepage" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"imported" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"unchanged" integer DEFAULT 0 NOT NULL,
	"duplicates" integer DEFAULT 0 NOT NULL,
	"missing" integer DEFAULT 0 NOT NULL,
	"errors" jsonb,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "event_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "follow_kind" NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"kind" text NOT NULL,
	"channel" "notification_channel" DEFAULT 'email' NOT NULL,
	"subject" text,
	"payload" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL,
	"notify" boolean DEFAULT true NOT NULL,
	"last_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"city" text,
	"radius_km" integer DEFAULT 40 NOT NULL,
	"game_slugs" text[] DEFAULT '{}'::text[] NOT NULL,
	"event_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"digest_day_of_week" integer DEFAULT 1 NOT NULL,
	"digest_enabled" boolean DEFAULT true NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"change_notifications_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" integer DEFAULT 22 NOT NULL,
	"quiet_hours_end" integer DEFAULT 8 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"is_moderator" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_by" uuid,
	"contact_email" text NOT NULL,
	"source_url" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"status" text DEFAULT 'unknown' NOT NULL,
	"http_status" integer,
	"checked_at" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"contact_email" text,
	"status" text DEFAULT 'open' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digest_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_of" timestamp with time zone NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbound_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"event_id" uuid,
	"community_id" uuid,
	"organization_id" uuid,
	"venue_id" uuid,
	"target_url" text,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_games" ADD CONSTRAINT "community_games_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_games" ADD CONSTRAINT "community_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_discord_configs" ADD CONSTRAINT "org_discord_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_claims" ADD CONSTRAINT "organization_claims_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_field_sources" ADD CONSTRAINT "event_field_sources_event_id_event_occurrences_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_games" ADD CONSTRAINT "event_games_event_id_event_occurrences_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_links" ADD CONSTRAINT "event_links_event_id_event_occurrences_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_series_id_event_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."event_series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "communities_slug_idx" ON "communities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "communities_city_idx" ON "communities" USING btree ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "community_games_pk" ON "community_games" USING btree ("community_id","game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "games_slug_idx" ON "games" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_slug_idx" ON "venues" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city");--> statement-breakpoint
CREATE INDEX "venues_status_idx" ON "venues" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "org_discord_configs_guild_uniq" ON "org_discord_configs" USING btree ("organization_id","guild_id");--> statement-breakpoint
CREATE INDEX "organization_claims_status_idx" ON "organization_claims" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_uniq" ON "organization_memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_user_idx" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "team_members_team_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_slug_idx" ON "teams" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "teams_pathway_idx" ON "teams" USING btree ("pathway");--> statement-breakpoint
CREATE UNIQUE INDEX "user_discord_links_user_uniq" ON "user_discord_links" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_discord_links_discord_uniq" ON "user_discord_links" USING btree ("discord_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_field_sources_uniq" ON "event_field_sources" USING btree ("event_id","field");--> statement-breakpoint
CREATE UNIQUE INDEX "event_games_pk" ON "event_games" USING btree ("event_id","game_id");--> statement-breakpoint
CREATE INDEX "event_links_event_idx" ON "event_links" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_occurrences_slug_idx" ON "event_occurrences" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "event_occurrences_starts_at_idx" ON "event_occurrences" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "event_occurrences_status_starts_idx" ON "event_occurrences" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "event_occurrences_org_idx" ON "event_occurrences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_occurrences_series_idx" ON "event_occurrences" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "event_occurrences_city_idx" ON "event_occurrences" USING btree ("city");--> statement-breakpoint
CREATE INDEX "event_occurrences_region_idx" ON "event_occurrences" USING btree ("region");--> statement-breakpoint
CREATE INDEX "event_occurrences_source_record_idx" ON "event_occurrences" USING btree ("source_record_id");--> statement-breakpoint
CREATE INDEX "event_series_org_idx" ON "event_series" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "change_records_entity_idx" ON "change_records" USING btree ("entity_kind","entity_id");--> statement-breakpoint
CREATE INDEX "duplicate_candidates_status_idx" ON "duplicate_candidates" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "source_records_uniq" ON "source_records" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "source_records_entity_idx" ON "source_records" USING btree ("entity_kind","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_key_idx" ON "sources" USING btree ("key");--> statement-breakpoint
CREATE INDEX "sync_runs_source_idx" ON "sync_runs" USING btree ("source_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_follows_uniq" ON "event_follows" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_uniq" ON "follows" USING btree ("user_id","kind","target_id");--> statement-breakpoint
CREATE INDEX "follows_target_idx" ON "follows" USING btree ("kind","target_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_user_idx" ON "notification_deliveries" USING btree ("user_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_events_uniq" ON "saved_events" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "saved_searches_user_idx" ON "saved_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_profiles_email_idx" ON "user_profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "event_submissions_status_idx" ON "event_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "link_checks_url_idx" ON "link_checks" USING btree ("url");--> statement-breakpoint
CREATE INDEX "redirects_from_idx" ON "redirects" USING btree ("from_path");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_target_idx" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "digest_sends_user_week_idx" ON "digest_sends" USING btree ("user_id","week_of");--> statement-breakpoint
CREATE INDEX "outbound_clicks_event_idx" ON "outbound_clicks" USING btree ("event_id","created_at");