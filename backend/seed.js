require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.approvalStep.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.company.deleteMany({});

  console.log('Cleared existing data.');

  const company = await prisma.company.create({
    data: { name: 'Demo Company', currency: 'INR' }
  });

  const passwordHash = await bcrypt.hash('demo1234', 10);

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Admin User',
      email: 'admin@demo.com',
      passwordHash,
      role: 'ADMIN'
    }
  });

  // 1 Manager
  const manager = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Manager User',
      email: 'manager@demo.com',
      passwordHash,
      role: 'MANAGER',
      isManagerApprover: true
    }
  });

  // 2 Employees
  const employee1 = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Employee One',
      email: 'employee@demo.com',
      passwordHash,
      role: 'EMPLOYEE',
      managerId: manager.id
    }
  });

  const employee2 = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Employee Two',
      email: 'employee2@demo.com',
      passwordHash,
      role: 'EMPLOYEE',
      managerId: manager.id
    }
  });

  // Sample Expenses
  // Expense 1: Pending review
  const expense1 = await prisma.expense.create({
    data: {
      companyId: company.id,
      submittedById: employee1.id,
      amount: 1500,
      currency: 'INR',
      category: 'Travel',
      description: 'Flight to conferences',
      date: new Date('2026-03-25T10:00:00Z'),
      status: 'IN_REVIEW',
    }
  });

  await prisma.approvalStep.create({
    data: {
      expenseId: expense1.id,
      approverId: manager.id,
      sequence: 1,
      status: 'PENDING'
    }
  });

  // Expense 2: Approved
  const expense2 = await prisma.expense.create({
    data: {
      companyId: company.id,
      submittedById: employee2.id,
      amount: 250,
      currency: 'INR',
      category: 'Food',
      description: 'Team lunch',
      date: new Date('2026-03-28T12:00:00Z'),
      status: 'APPROVED',
    }
  });

  await prisma.approvalStep.create({
    data: {
      expenseId: expense2.id,
      approverId: manager.id,
      sequence: 1,
      status: 'APPROVED',
      comment: 'Looks good',
      decidedAt: new Date()
    }
  });

  console.log('Seed completed successfully.');
  console.log('Admin:', admin.email, '/ demo1234');
  console.log('Manager:', manager.email, '/ demo1234');
  console.log('Employee:', employee1.email, '/ demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
