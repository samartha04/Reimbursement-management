const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({ log: ['query'] });
  console.log("Success");
} catch(e) {
  console.log(e.message);
}
