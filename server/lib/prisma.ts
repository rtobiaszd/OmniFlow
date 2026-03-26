// Import necessary libraries
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

// Create a function to initialize the Prisma client singleton
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  const host = connectionString?.split('@')[1]?.split(':')[0];
  console.log(`Prisma: Connecting to database at ${host || 'unknown'}...`);
  const pool = new Pool({ 
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  });

  // Handle errors on the database connection pool
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  // Create a Prisma adapter using the connection pool
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter, datasources: { db: { url: connectionString } } });
};

// Declare a global variable for the Prisma client
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

globalThis.prisma = globalThis.prisma ?? prismaClientSingleton();

export default globalThis.prisma;
