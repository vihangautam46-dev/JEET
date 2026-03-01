import { Pool } from 'pg';
import Redis from 'ioredis';
import { env } from '../config/env';

export const pool = new Pool({ connectionString: env.databaseUrl });
export const redis = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
