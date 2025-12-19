import * as schema from "@shared/schema";
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Validate DATABASE_URL format
const dbUrl = process.env.DATABASE_URL.trim();
if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  throw new Error(
    `Invalid DATABASE_URL format. Expected postgresql:// or postgres://, but got: ${dbUrl.substring(0, 20)}...\n` +
    "Please ensure your DATABASE_URL is a valid PostgreSQL connection string."
  );
}

// Detect if using local PostgreSQL or Neon
const isLocalDatabase = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') || dbUrl.includes('::1');

let pool: PgPool | NeonPool;
let db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleNeon>;

if (isLocalDatabase) {
  // Use standard PostgreSQL driver for local databases
  pool = new PgPool({ connectionString: dbUrl });
  db = drizzlePg(pool, { schema });
  console.log("✓ Using local PostgreSQL database");
} else {
  // Use Neon serverless driver for remote Neon databases
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: dbUrl });
  db = drizzleNeon(pool, { schema });
  console.log("✓ Using Neon serverless database");
}

export { pool, db };