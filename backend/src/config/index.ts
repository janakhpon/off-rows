import { config } from "dotenv";
config();

export const ENV = process.env.NODE_ENV || "development";
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const DATABASE_URL = process.env.DATABASE_URL || "";
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// AWS S3 Configuration
export const AWS_REGION = process.env.AWS_REGION || "us-east-1";
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || "";
