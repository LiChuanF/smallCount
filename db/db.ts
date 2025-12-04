import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseAsync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'
import { Platform } from 'react-native'
import * as schema from './schema'

const DB_NAME = 'small_count_app.db'

export type DbType = ReturnType<typeof drizzle<typeof schema>>

let _db: DbType | null = null
let _initPromise: Promise<void> | null = null // 防止并发调用

// ==========================================
// 1. SQL 定义 这里要通过命令生成的sql，直接复制粘贴即可，但是表之间如果有引用，需要手动修改表顺序，因为命令生成的表顺序可能不是我们期望的，他是按照字母顺序生成的
// ==========================================
const MIGRATION_SQL = `
-- 1. Users
CREATE TABLE IF NOT EXISTS \`users\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`username\` text NOT NULL,
	\`email\` text,
	\`password_hash\` text,
	\`phone\` text,
	\`avatar_url\` text,
	\`display_name\` text,
	\`currency\` text DEFAULT 'CNY',
	\`is_active\` integer DEFAULT true,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')),
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')),
	\`last_login_at\` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS \`users_username_unique\` ON \`users\` (\`username\`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS \`users_email_unique\` ON \`users\` (\`email\`);
--> statement-breakpoint

-- 2. Accounts
CREATE TABLE IF NOT EXISTS \`accounts\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`user_id\` text NOT NULL,
	\`name\` text NOT NULL,
	\`type\` text NOT NULL,
	\`balance\` real DEFAULT 0,
	\`currency\` text DEFAULT 'CNY',
	\`icon\` text,
	\`color\` text,
	\`account_number\` text,
	\`bank_name\` text,
	\`credit_limit\` real DEFAULT 0,
	\`billing_day\` integer,
	\`due_day\` integer,
	\`is_active\` integer DEFAULT true,
	\`is_default\` integer DEFAULT false,
	\`notes\` text,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')),
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- 3. Transactions
CREATE TABLE IF NOT EXISTS \`transactions\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`type\` text NOT NULL,
	\`amount\` real NOT NULL,
	\`description\` text NOT NULL,
	\`account_id\` text NOT NULL,
	\`transfer_account_id\` text,
	\`transaction_date\` integer NOT NULL,
	\`transaction_time\` text,
	\`payment_method\` text NOT NULL,
	\`location\` text,
	\`notes\` text,
	\`receipt_image_url\` text,
	\`is_recurring\` integer DEFAULT false,
	\`recurring_rule\` text,
	\`is_confirmed\` integer DEFAULT true,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')),
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (\`transfer_account_id\`) REFERENCES \`accounts\`(\`id\`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- 4. Budgets
CREATE TABLE IF NOT EXISTS \`budgets\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`account_id\` text NOT NULL,
	\`amount\` real NOT NULL,
	\`period\` text DEFAULT 'monthly',
	\`year\` integer NOT NULL,
	\`month\` integer,
	\`week\` integer,
	\`is_active\` integer DEFAULT true,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')),
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- 5. Tags
CREATE TABLE IF NOT EXISTS \`tags\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`transaction_id\` text NOT NULL,
	\`name\` text NOT NULL,
	\`color\` text,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (\`transaction_id\`) REFERENCES \`transactions\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- 6. Attachments
CREATE TABLE IF NOT EXISTS \`attachments\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`transaction_id\` text NOT NULL,
	\`file_name\` text NOT NULL,
	\`file_url\` text NOT NULL,
	\`file_type\` text,
	\`file_size\` integer,
	\`uploaded_at\` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (\`transaction_id\`) REFERENCES \`transactions\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`

// ==========================================
// 2. 辅助函数
// ==========================================

async function runWebMigrations(expoDb: SQLiteDatabase) {
    const statements = MIGRATION_SQL.split('--> statement-breakpoint')

    for (const statement of statements) {
        const cleanSql = statement.trim()
        // 过滤掉空语句或纯注释
        if (!cleanSql || (cleanSql.startsWith('--') && !cleanSql.includes('\n'))) {
            continue
        }

        try {
            await expoDb.execAsync(cleanSql)
        } catch (e: any) {
            console.error('Migration failed on SQL:', cleanSql.substring(0, 100))
            console.error('Error detail:', e)
            // 防止出现 "no such table"
            throw new Error(`Migration stopped due to error: ${e.message}`)
        }
    }
}

// ==========================================
// 3. 初始化逻辑
// ==========================================

const _init = async () => {
    if (_db) return

    if (Platform.OS === 'web') {
        try {
            const expoDb = await openDatabaseAsync(DB_NAME)

            // 可选：启用 WAL 模式可能有助于某些并发情况，但在 Web WASM 上支持有限
            // await expoDb.execAsync('PRAGMA journal_mode = WAL;');

            await runWebMigrations(expoDb)
            _db = drizzle(expoDb, {
                schema,
                // logger: {
                //   logQuery: (query, params) => {
                //     console.log('📝 SQL Query:', query);
                //     if (params && params.length > 0) {
                //       console.log('📝 SQL Params:', params);
                //     }
                //   }
                // }
            })
            console.log('✅ Web Database initialized')
        } catch (e: any) {
            // 专门处理 Web 锁错误
            if (
                String(e).includes('NoModificationAllowedError') ||
                String(e).includes('Access Handles')
            ) {
                console.error('🛑 数据库被锁定。请关闭其他标签页或完全刷新页面。')
                // 在开发环境下，这通常意味着热重载导致的句柄未释放
                // 我们可以尝试让用户知道需要硬刷新
                alert(
                    '数据库文件被锁定 (Dev Mode Lock)。请关闭所有标签页并重新打开，或清除浏览器缓存。',
                )
            } else {
                console.error(
                    '在浏览器中初始化数据库失败: 请确保数据库文件没有被其他进程锁定，没有被其他浏览器插件影响',
                    e,
                )
            }
            throw e
        }
    } else {
        const expoDb = openDatabaseSync(DB_NAME)
        _db = drizzle(expoDb, { schema })
    }
}

export const initDatabase = async (): Promise<void> => {
    // 防止并发初始化（例如 App 组件重渲染导致多次调用）
    if (!_initPromise) {
        _initPromise = _init().catch(err => {
            _initPromise = null // 失败允许重试
            throw err
        })
    }
    return _initPromise
}

// ==========================================
// 4. 导出 db Proxy
// ==========================================

export const db = new Proxy({} as DbType, {
    get: (_target, prop) => {
        if (_db) return (_db as any)[prop]

        if (Platform.OS !== 'web') {
            // Native 端自动同步回退
            const expoDb = openDatabaseSync(DB_NAME)
            _db = drizzle(expoDb, {
                schema,
                // logger: {
                //   logQuery: (query, params) => {
                //     console.log('📝 SQL Query:', query);
                //     if (params && params.length > 0) {
                //       console.log('📝 SQL Params:', params);
                //     }
                //   }
                // }
            })
            return (_db as any)[prop]
        }

        throw new Error('Database not initialized. Call "await initDatabase()" first.')
    },
})
