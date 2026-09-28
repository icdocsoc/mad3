DO $$ BEGIN
 CREATE TYPE "public"."commute" AS ENUM('halls', 'nearby', 'commute', 'far');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."drinking" AS ENUM('round-buyer', 'soft-drink', 'couple', 'rather-not');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."late_nights" AS ENUM('out-till-late', 'one-club-night', 'home-by-midnight', 'quiet');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."meeting_people" AS ENUM('energising', 'fine', 'depends', 'draining');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."societies" AS ENUM('everything', 'few', 'unsure', 'little');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "preferred_name" text;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "gender_description" text;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "commute" "commute";--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "drinking" "drinking";--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "late_nights" "late_nights";--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "societies" "societies";--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "meeting_people" "meeting_people";--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "instagram" text;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "discord" text;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "phone" text;