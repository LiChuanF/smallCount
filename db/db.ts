import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const DB_NAME = 'small_count_app.db';

// 初始化 Expo SQLite 数据库
const expoDb = openDatabaseSync(DB_NAME);

// 初始化 Drizzle ORM
export const db = drizzle(expoDb, { schema });

// 导出类型以便 Repository 使用
export type DbType = typeof db;