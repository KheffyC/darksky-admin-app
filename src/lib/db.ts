// lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL, { prepare: false });
export const db = drizzle(client, { schema });

export type DB = typeof db;