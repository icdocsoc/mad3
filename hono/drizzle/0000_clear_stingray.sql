CREATE TABLE `family` (
	`kid` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	FOREIGN KEY (`kid`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id`) REFERENCES `marriage`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `marriage` (
	`id` text PRIMARY KEY NOT NULL,
	`parent1` text NOT NULL,
	`parent2` text NOT NULL,
	`has_female` integer NOT NULL,
	`has_jmc` integer NOT NULL,
	FOREIGN KEY (`parent1`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent2`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`proposer` text PRIMARY KEY NOT NULL,
	`proposee` text NOT NULL,
	FOREIGN KEY (`proposer`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proposee`) REFERENCES `student`(`shortcode`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student` (
	`shortcode` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`gender` text,
	`jmc` integer NOT NULL,
	`socials` text,
	`interests` text
);
