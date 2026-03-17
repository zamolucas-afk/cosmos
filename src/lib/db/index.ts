import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { Pool } from '@neondatabase/serverless'
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
export const poolDb = drizzlePool(pool, { schema })
