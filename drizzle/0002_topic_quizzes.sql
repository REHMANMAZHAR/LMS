CREATE TABLE `quiz_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text DEFAULT 'talha-family' NOT NULL,
	`topic_id` text NOT NULL,
	`quiz_version` text NOT NULL,
	`question_ids` text NOT NULL,
	`started_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`submitted_at` text
);
--> statement-breakpoint
CREATE INDEX `quiz_session_family_idx` ON `quiz_sessions` (`family_id`,`topic_id`,`started_at`);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`family_id` text DEFAULT 'talha-family' NOT NULL,
	`session_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`subject` text NOT NULL,
	`quiz_version` text NOT NULL,
	`timed` integer DEFAULT false NOT NULL,
	`score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`duration_seconds` integer NOT NULL,
	`responses_json` text NOT NULL,
	`feedback_json` text NOT NULL,
	`error_summary` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_attempt_session_idx` ON `quiz_attempts` (`session_id`);
--> statement-breakpoint
CREATE INDEX `quiz_attempt_family_topic_idx` ON `quiz_attempts` (`family_id`,`topic_id`,`created_at`);
