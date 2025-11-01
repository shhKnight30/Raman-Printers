/**
 * @file src/app/api/setup/route.ts
 * @description One-time database setup endpoint to create tables
 * DELETE THIS FILE AFTER RUNNING ONCE
 */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // This will create all tables based on your schema
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "phone" TEXT NOT NULL UNIQUE,
        "name" TEXT,
        "email" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "files" TEXT NOT NULL,
        "totalPages" INTEGER NOT NULL,
        "totalAmount" REAL NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
        "payLater" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Token" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );

      CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
      CREATE INDEX IF NOT EXISTS "Order_phone_idx" ON "Order"("phone");
      CREATE INDEX IF NOT EXISTS "Token_userId_idx" ON "Token"("userId");
      CREATE INDEX IF NOT EXISTS "Token_token_idx" ON "Token"("token");
    `);

    return NextResponse.json({ 
      success: true, 
      message: 'Database tables created successfully! DELETE THIS ENDPOINT NOW.' 
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
