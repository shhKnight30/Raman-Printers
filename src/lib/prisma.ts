/**
 * @file lib/prisma.ts
 * @description Initializes and exports a singleton Prisma Client instance.
 * This prevents creating too many connections to the database, especially in a serverless environment.
 */
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export { prisma };
export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
