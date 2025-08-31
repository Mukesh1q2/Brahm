// Basic Prisma client helper (lazy-loaded in API routes)
// Do NOT import '@prisma/client' at module scope to avoid build-time resolution
// in environments where prisma is not installed. Resolve dynamically at runtime.

let prisma: any = null;

export function getPrisma() {
  if (!prisma) {
    try {
      // Use eval to avoid bundlers trying to resolve '@prisma/client' statically
      const req = (0, eval)('require');
      const { PrismaClient } = req('@prisma/client');
      prisma = new PrismaClient();
    } catch (e) {
      throw new Error("Prisma client not installed. Set DATABASE_URL and install @prisma/client to enable DB persistence.");
    }
  }
  return prisma as any;
}

