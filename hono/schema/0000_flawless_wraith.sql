CREATE TABLE `meta` (
	`id` integer PRIMARY KEY DEFAULT 1 CHECK (id = 1) NOT NULL,
	`state` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `family` (
	`kid` text PRIMARY KEY NOT NULL,
	`id` integer NOT NULL,
	FOREIGN KEY (`kid`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id`) REFERENCES `marriage`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `marriage` (
	`id` integer PRIMARY KEY NOT NULL,
	`parent1` text NOT NULL,
	`parent2` text NOT NULL,
	FOREIGN KEY (`parent1`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent2`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`proposer` text NOT NULL,
	`proposee` text NOT NULL,
	PRIMARY KEY(`proposer`, `proposee`),
	FOREIGN KEY (`proposer`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proposee`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student` (
	`shortcode` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`completed_survey` integer NOT NULL,
	`jmc` integer,
	`name` text,
	`gender` text,
	`interests` text,
	`socials` text,
	`about_me` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `marriage_parent1_unique` ON `marriage` (`parent1`);--> statement-breakpoint
CREATE UNIQUE INDEX `marriage_parent2_unique` ON `marriage` (`parent2`);