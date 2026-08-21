import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const rawConnectionString = process.env.DATABASE_URL
  if (!rawConnectionString) {
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (prop === 'then') return undefined
        throw new Error(
          `DATABASE_URL environment variable is not set. Cannot access prisma.${String(prop)}.`
        )
      },
    })
  }

  // Strip sslmode from the URL query string so pg-connection-string doesn't enforce
  // strict TLS verification which rejects Supabase pooler self-signed root certs.
  const cleanedConnectionString = rawConnectionString
    .replace(/[?&]sslmode=[^&]*/g, '')
    .replace(/\?&/, '?')
    .replace(/\?$/, '')

  const isRemote =
    rawConnectionString.includes('supabase.co') ||
    rawConnectionString.includes('pooler.supabase.com') ||
    rawConnectionString.includes('neon.tech') ||
    rawConnectionString.includes('sslmode=')

  // Optimize pg.Pool for Serverless:
  // - max: 2 connections per lambda instance to prevent pool exhaustion on Supabase
  // - idleTimeoutMillis: 2000 to quickly return connections to the pool
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: cleanedConnectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: process.env.NODE_ENV === 'production' ? 2 : 5,
      idleTimeoutMillis: 2000,
      connectionTimeoutMillis: 5000,
    })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
