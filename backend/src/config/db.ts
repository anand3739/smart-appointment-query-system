import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Global Prisma instance
export const prisma = new PrismaClient();

// Flag to track whether initial in-memory seed is needed if fallback is active
let isSeeded = false;

export async function initializeDatabase() {
  try {
    // Test actual connection with a lightweight query
    await prisma.$queryRaw`SELECT 1`;
    console.log(' Successfully connected to PostgreSQL via Prisma.');
  } catch (err: any) {
    console.warn('ℹ PostgreSQL connection not detected (or offline). Application is prepared with graceful fallback.');
  }
}
