ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "survey_version" integer;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "draft" jsonb;