CREATE TABLE `infrastructure_purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`institution_id` integer NOT NULL,
	`purchase_date` integer,
	`number_of_pcs` integer DEFAULT 0 NOT NULL,
	`pc_cost_total` real DEFAULT 0 NOT NULL,
	`number_of_lan_nodes` integer DEFAULT 0 NOT NULL,
	`lan_cost_total` real DEFAULT 0 NOT NULL,
	`total_cost` real DEFAULT 0 NOT NULL,
	`notes` text,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `institutions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`address` text NOT NULL,
	`county` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`contact_name` text NOT NULL,
	`contact_role` text NOT NULL,
	`contact_phone` text NOT NULL,
	`contact_email` text NOT NULL,
	`registration_status` text DEFAULT 'pending' NOT NULL,
	`registration_date` integer,
	`bandwidth_mbps` integer,
	`service_status` text DEFAULT 'inactive' NOT NULL,
	`connection_date` integer,
	`has_computers` integer DEFAULT false NOT NULL,
	`has_lan` integer DEFAULT false NOT NULL,
	`number_of_users` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `institutions_email_unique` ON `institutions` (`email`);--> statement-breakpoint
CREATE TABLE `monthly_bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`institution_id` integer NOT NULL,
	`billing_month` text NOT NULL,
	`bandwidth_mbps` integer NOT NULL,
	`base_amount` real NOT NULL,
	`is_upgrade` integer DEFAULT false,
	`discount_amount` real DEFAULT 0,
	`total_amount` real NOT NULL,
	`due_date` integer NOT NULL,
	`paid_date` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`overdue_fine` real DEFAULT 0,
	`reconnection_fee` real DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`institution_id` integer NOT NULL,
	`payment_type` text NOT NULL,
	`amount` real NOT NULL,
	`payment_date` integer,
	`billing_month` text,
	`bandwidth_mbps` integer,
	`is_upgrade` integer DEFAULT false,
	`discount_amount` real DEFAULT 0,
	`notes` text,
	`status` text DEFAULT 'paid' NOT NULL,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE no action
);
