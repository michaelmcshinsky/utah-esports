CREATE TYPE "public"."deadline_precision" AS ENUM('date', 'datetime');--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD COLUMN "registration_deadline_precision" "deadline_precision";--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD COLUMN "late_fee_starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD COLUMN "late_fee_precision" "deadline_precision";--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD COLUMN "late_fee_note" text;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD COLUMN "ticket_url" text;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD COLUMN "schedule_url" text;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD COLUMN "results_url" text;