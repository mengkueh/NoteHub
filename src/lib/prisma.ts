// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Disconnect when the Node.js process ends
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// const seedProducts = async () => {
//     const count = await prisma.product.count();
//         if (count === 0) {
//             await prisma.product.createMany({
//                 data: [
//                     { title: "Product 1", price: 500, description: "Description 1" },
//                     { title: "Product 2", price: 700, description: "Description 2" },
//                     { title: "Product 3", price: 1000, description: "Description 3" },
//                 ],
//             });
//         }
// };