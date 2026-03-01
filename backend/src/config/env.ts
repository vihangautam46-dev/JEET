import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgres://jeet:jeet@localhost:5432/jeet',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'super-secret',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000'
};
