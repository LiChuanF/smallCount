-- 1. 先创建 Users (最基础的表，被 Accounts 引用)
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`password_hash` text,
	`phone` text,
	`avatar_url` text,
	`display_name` text,
	`currency` text DEFAULT 'CNY',
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint

-- 2. 创建 Accounts (引用 Users)
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`balance` real DEFAULT 0,
	`currency` text DEFAULT 'CNY',
	`icon` text,
	`color` text,
	`account_number` text,
	`bank_name` text,
	`credit_limit` real DEFAULT 0,
	`billing_day` integer,
	`due_day` integer,
	`is_active` integer DEFAULT true,
	`is_default` integer DEFAULT false,
	`notes` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- 3. 创建 Transactions (引用 Accounts)
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`description` text NOT NULL,
	`account_id` text NOT NULL,
	`transfer_account_id` text,
	`transaction_date` integer NOT NULL,
	`transaction_time` text,
	`payment_method` text NOT NULL,
	`location` text,
	`notes` text,
	`receipt_image_url` text,
	`is_recurring` integer DEFAULT false,
	`recurring_rule` text,
	`is_confirmed` integer DEFAULT true,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transfer_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- 4. 创建 Budgets (引用 Accounts)
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`amount` real NOT NULL,
	`period` text DEFAULT 'monthly',
	`year` integer NOT NULL,
	`month` integer,
	`week` integer,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- 5. 创建 Tags (引用 Transactions)
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- 6. 创建 Attachments (引用 Transactions)
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_url` text NOT NULL,
	`file_type` text,
	`file_size` integer,
	`uploaded_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);