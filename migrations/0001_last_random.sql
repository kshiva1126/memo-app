CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` text NOT NULL,
	`icon_url` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text DEFAULT (DATETIME('now', 'localtime')) NOT NULL
);
