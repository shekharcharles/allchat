import { PrismaClient } from '@prisma/client'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient | undefined
}

const prisma =
  global.prisma ||
  new PrismaClient({
    // Optional: log Prisma queries
    // log: ['query', 'info', 'warn', 'error'],
    // Disable transactions for MongoDB standalone
    transactionOptions: {
      maxWait: 2000,
      timeout: 5000,
    },
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
