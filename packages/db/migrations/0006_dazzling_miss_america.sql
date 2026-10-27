CREATE TYPE "public"."rbac_scope" AS ENUM('platform', 'org');--> statement-breakpoint
CREATE TABLE "authz_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"scope" "rbac_scope",
	"resource_type" text,
	"resource_id" uuid,
	"permission" text,
	"decision" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"scope" "rbac_scope" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"scope" "rbac_scope" NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_built_in" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_platform_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"granted_by" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_platform_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_platform_roles" ADD CONSTRAINT "user_platform_roles_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_platform_roles" ADD CONSTRAINT "user_platform_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "authz_events_actor_idx" ON "authz_events" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "authz_events_action_idx" ON "authz_events" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "authz_events_created_idx" ON "authz_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_key_idx" ON "permissions" USING btree ("key");--> statement-breakpoint
CREATE INDEX "permissions_scope_idx" ON "permissions" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_key_idx" ON "roles" USING btree ("key");--> statement-breakpoint
CREATE INDEX "roles_scope_idx" ON "roles" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "user_platform_roles_role_idx" ON "user_platform_roles" USING btree ("role_id");