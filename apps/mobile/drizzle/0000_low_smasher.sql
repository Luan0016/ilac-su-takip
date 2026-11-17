CREATE TABLE `dose_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`medication_id` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`status` text NOT NULL,
	`taken_at` text,
	`snoozed_until` text,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dose_logs_med_time` ON `dose_logs` (`medication_id`,`scheduled_at`);--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`form` text NOT NULL,
	`dose_amount` real NOT NULL,
	`dose_unit` text NOT NULL,
	`strength` text,
	`color` text NOT NULL,
	`notes` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`stock_quantity` real NOT NULL,
	`stock_set_at` text NOT NULL,
	`refill_threshold_days` integer DEFAULT 7 NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`medication_id` text NOT NULL,
	`type` text NOT NULL,
	`times` text NOT NULL,
	`weekdays` text NOT NULL,
	`interval_hours` integer,
	`anchor_time` text,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `water_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`amount_ml` integer NOT NULL,
	`logged_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `water_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_goal_ml` integer NOT NULL,
	`wake_time` text NOT NULL,
	`sleep_time` text NOT NULL,
	`interval_minutes` integer NOT NULL,
	`cup_sizes_ml` text NOT NULL,
	`enabled` integer NOT NULL,
	`onboarded` integer DEFAULT false NOT NULL
);
