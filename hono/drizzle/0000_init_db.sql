CREATE TABLE `auth` (
	`email` text PRIMARY KEY NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `family` (
	`kid` text PRIMARY KEY NOT NULL,
	`id` text,
	FOREIGN KEY (`kid`) REFERENCES `student`(`email`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id`) REFERENCES `marriage`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `marriage` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`has_female` integer NOT NULL,
	`has_jmc` integer NOT NULL,
	FOREIGN KEY (`email`) REFERENCES `student`(`email`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`email` text NOT NULL,
	FOREIGN KEY (`email`) REFERENCES `student`(`email`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`gender` text,
	`jmc` integer,
	`socials` text,
	`interests` text,
	FOREIGN KEY (`email`) REFERENCES `auth`(`email`) ON UPDATE no action ON DELETE no action
);
