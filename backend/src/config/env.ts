import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_queue?schema=public',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-development-key-smart-queue-2026!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  RESERVATION_HOLD_MINUTES: parseInt(process.env.RESERVATION_HOLD_MINUTES || '10', 10),
  APPOINTMENT_REMINDER_HOURS_BEFORE: parseInt(process.env.APPOINTMENT_REMINDER_HOURS_BEFORE || '24', 10),
  WAITLIST_OFFER_EXPIRY_MINUTES: parseInt(process.env.WAITLIST_OFFER_EXPIRY_MINUTES || '30', 10),
};
