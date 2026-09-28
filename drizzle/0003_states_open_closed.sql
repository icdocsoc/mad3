ALTER TABLE "meta" ALTER COLUMN "state" SET DATA TYPE text;--> statement-breakpoint
-- Every stage that took sign-ups is now "open"; only "closed" keeps its meaning.
UPDATE "meta" SET "state" = CASE WHEN "state" = 'closed' THEN 'closed' ELSE 'open' END;--> statement-breakpoint
DROP TYPE "public"."app_state";--> statement-breakpoint
CREATE TYPE "public"."app_state" AS ENUM('open', 'closed');--> statement-breakpoint
ALTER TABLE "meta" ALTER COLUMN "state" SET DATA TYPE "public"."app_state" USING "state"::"public"."app_state";--> statement-breakpoint
-- The app cannot serve a page without this row, and nothing but the ABC seed used to create it.
INSERT INTO "meta" ("id", "state") VALUES (1, 'closed') ON CONFLICT ("id") DO NOTHING;
