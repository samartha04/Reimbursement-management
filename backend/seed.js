const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing data...');
  // Delete in correct FK order
  await prisma.notification.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.approvalRule.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('Creating demo company...');
  const company = await prisma.company.create({
    data: {
      name: 'TechCorp India',
      currency: 'INR'
    }
  });

  const passwordHash = await bcrypt.hash('demo1234', 10);

  console.log('Creating demo users...');
  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Priya Sharma',
      email: 'admin@expenseflow.com',
      passwordHash,
      role: 'ADMIN',
      isManagerApprover: true
    }
  });

  const vikram = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Vikram Nair',
      email: 'director@expenseflow.com',
      passwordHash,
      role: 'MANAGER',
      isManagerApprover: true
    }
  });

  const rahul = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Rahul Mehta',
      email: 'manager@expenseflow.com',
      passwordHash,
      role: 'MANAGER',
      isManagerApprover: true,
      managerId: vikram.id
    }
  });

  const anjali = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Anjali Desai',
      email: 'employee@expenseflow.com',
      passwordHash,
      role: 'EMPLOYEE',
      managerId: rahul.id
    }
  });

  console.log('Creating approval rule...');
  await prisma.approvalRule.create({
    data: {
      companyId: company.id,
      name: '50% Approver Threshold',
      ruleType: 'PERCENTAGE',
      percentageThreshold: 50,
      isActive: true
    }
  });

  console.log('Creating expenses and approval steps...');
  const expense1 = await prisma.expense.create({
    data: {
      companyId: company.id,
      submittedById: anjali.id,
      amount: 70975,
      currency: 'INR',
      submittedCurrency: 'USD',
      submittedAmount: 850,
      companyCurrency: 'INR',
      companyAmount: 70975,
      exchangeRate: 83.5,
      category: 'Travel',
      description: 'Flight to Mumbai for client meeting — IndiGo 6E-204',
      date: new Date('2024-12-10T00:00:00Z'),
      status: 'APPROVED',
      approvalSteps: {
        create: [
          {
            approverId: rahul.id,
            sequence: 1,
            status: 'APPROVED',
            comment: 'Verified — client visit was scheduled. Approved.',
            decidedAt: new Date('2024-12-11T00:00:00Z')
          },
          {
            approverId: vikram.id,
            sequence: 2,
            status: 'APPROVED',
            comment: 'Looks good. Final approval granted.',
            decidedAt: new Date('2024-12-12T00:00:00Z')
          }
        ]
      }
    }
  });

  const expense2 = await prisma.expense.create({
    data: {
      companyId: company.id,
      submittedById: anjali.id,
      amount: 1200,
      currency: 'INR',
      submittedCurrency: 'INR',
      submittedAmount: 1200,
      companyCurrency: 'INR',
      companyAmount: 1200,
      exchangeRate: 1,
      category: 'Food',
      description: 'Team lunch at Taj Hotel',
      date: new Date('2024-12-15T00:00:00Z'),
      status: 'REJECTED',
      approvalSteps: {
        create: [
          {
            approverId: rahul.id,
            sequence: 1,
            status: 'REJECTED',
            comment: 'This was already reimbursed last month. Please check before resubmitting.',
            decidedAt: new Date('2024-12-16T00:00:00Z')
          }
        ]
      }
    }
  });

  const expense3 = await prisma.expense.create({
    data: {
      companyId: company.id,
      submittedById: anjali.id,
      amount: 28864,
      currency: 'INR',
      submittedCurrency: 'EUR',
      submittedAmount: 320,
      companyCurrency: 'INR',
      companyAmount: 28864,
      exchangeRate: 90.2,
      category: 'Accommodation',
      description: 'Hotel stay — Bangalore offsite, 2 nights at Marriott',
      date: new Date('2024-12-20T00:00:00Z'),
      status: 'IN_REVIEW',
      approvalSteps: {
        create: [
          {
            approverId: rahul.id,
            sequence: 1,
            status: 'APPROVED',
            comment: 'Confirmed offsite stay. Forwarding to Director.',
            decidedAt: new Date('2024-12-21T00:00:00Z')
          },
          {
            approverId: vikram.id,
            sequence: 2,
            status: 'PENDING'
          }
        ]
      }
    }
  });

  const expense4 = await prisma.expense.create({
    data: {
      companyId: company.id,
      submittedById: anjali.id,
      amount: 4500,
      currency: 'INR',
      submittedCurrency: 'INR',
      submittedAmount: 4500,
      companyCurrency: 'INR',
      companyAmount: 4500,
      exchangeRate: 1,
      category: 'Equipment',
      description: 'Mechanical keyboard for WFH setup — Keychron K2',
      date: new Date('2024-12-28T00:00:00Z'),
      status: 'IN_REVIEW',
      approvalSteps: {
        create: [
          {
            approverId: rahul.id,
            sequence: 1,
            status: 'PENDING'
          }
        ]
      }
    }
  });

  console.log('Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: vikram.id,
        type: 'APPROVAL_REQUIRED',
        title: 'New expense pending your review',
        body: 'Anjali Desai submitted a ₹28,864 Accommodation claim',
        expenseId: expense3.id,
        isRead: false
      },
      {
        userId: rahul.id,
        type: 'APPROVAL_REQUIRED',
        title: 'New expense pending your review',
        body: 'Anjali Desai submitted a ₹4,500 Equipment claim',
        expenseId: expense4.id,
        isRead: false
      },
      {
        userId: anjali.id,
        type: 'EXPENSE_APPROVED',
        title: 'Your expense was approved',
        body: 'Your ₹70,975 Travel claim has been fully approved',
        expenseId: expense1.id,
        isRead: false
      },
      {
        userId: anjali.id,
        type: 'EXPENSE_REJECTED',
        title: 'Your expense was rejected',
        body: 'Your ₹1,200 Food claim was rejected by Rahul Mehta: This was already reimbursed last month.',
        expenseId: expense2.id,
        isRead: true
      }
    ]
  });

  console.log('\n--- DEMO CREDENTIALS ---');
  console.log('Admin    | admin@expenseflow.com    | demo1234');
  console.log('Director | director@expenseflow.com | demo1234');
  console.log('Manager  | manager@expenseflow.com  | demo1234');
  console.log('Employee | employee@expenseflow.com | demo1234');
  console.log('------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
