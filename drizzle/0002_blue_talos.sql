CREATE TABLE IF NOT EXISTS "tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"issued_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL
);
