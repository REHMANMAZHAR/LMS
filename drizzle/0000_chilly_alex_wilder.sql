CREATE TABLE `activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`family_id` text DEFAULT 'talha-family' NOT NULL,
	`topic_id` text,
	`subject` text,
	`kind` text NOT NULL,
	`stage` integer,
	`score` integer,
	`max_score` integer,
	`minutes` integer,
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `progress` (
	`family_id` text DEFAULT 'talha-family' NOT NULL,
	`topic_id` text NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`best_score` integer,
	`last_studied_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`family_id`, `topic_id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`family_id` text DEFAULT 'talha-family' NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`family_id`, `key`)
);
