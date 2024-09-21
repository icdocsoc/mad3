DO $$ BEGIN
 CREATE TYPE "public"."app_state" AS ENUM('parents_open', 'parents_close', 'freshers_open', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'n/a');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."student_role" AS ENUM('fresher', 'parent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meta" (
	"id" integer PRIMARY KEY DEFAULT 1 CHECK (id = 1) NOT NULL,
	"state" "app_state" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "family" (
	"kid" text PRIMARY KEY NOT NULL,
	"id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marriage" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent1" text NOT NULL,
	"parent2" text NOT NULL,
	CONSTRAINT "marriage_parent1_unique" UNIQUE("parent1"),
	CONSTRAINT "marriage_parent2_unique" UNIQUE("parent2")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proposals" (
	"proposer" text NOT NULL,
	"proposee" text NOT NULL,
	CONSTRAINT "proposals_proposer_proposee_pk" PRIMARY KEY("proposer","proposee")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student" (
	"shortcode" text PRIMARY KEY NOT NULL,
	"role" "student_role" NOT NULL,
	"completed_survey" boolean NOT NULL,
	"jmc" boolean,
	"name" text,
	"gender" "gender",
	"interests" json,
	"socials" text[],
	"about_me" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family" ADD CONSTRAINT "family_kid_student_shortcode_fk" FOREIGN KEY ("kid") REFERENCES "public"."student"("shortcode") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family" ADD CONSTRAINT "family_id_marriage_id_fk" FOREIGN KEY ("id") REFERENCES "public"."marriage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "marriage" ADD CONSTRAINT "marriage_parent1_student_shortcode_fk" FOREIGN KEY ("parent1") REFERENCES "public"."student"("shortcode") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "marriage" ADD CONSTRAINT "marriage_parent2_student_shortcode_fk" FOREIGN KEY ("parent2") REFERENCES "public"."student"("shortcode") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposals" ADD CONSTRAINT "proposals_proposer_student_shortcode_fk" FOREIGN KEY ("proposer") REFERENCES "public"."student"("shortcode") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposals" ADD CONSTRAINT "proposals_proposee_student_shortcode_fk" FOREIGN KEY ("proposee") REFERENCES "public"."student"("shortcode") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
