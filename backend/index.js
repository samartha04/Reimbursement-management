require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const Tesseract = require('tesseract.js'); // Added for backend OCR fallback

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

const JWT_SECRET = 'supersecret';

// Conversion Caching Logic
const rateCache = { timestamp: null, rates: {} };
const getExchangeRate = async (baseCurrency, targetCurrency) => {
  if (baseCurrency === targetCurrency) return 1;
  const now = Date.now();
  if (!rateCache.rates[baseCurrency] || !rateCache.timestamp || (now - rateCache.timestamp > 3600000)) {
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      rateCache.rates[baseCurrency] = data.rates;
      rateCache.timestamp = now;
    } catch (err) {
      return 1;
    }
  }
  return rateCache.rates[baseCurrency]?.[targetCurrency] || 1;
};

// Middleware
const authMiddleware = (roles = []) => async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: missing token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { company: true },
    });
    if (!user) return res.status(401).json({ error: 'Unauthorized: user not found' });
    if (roles.length && !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { companyName, userName, email, password } = req.body;
    const company = await prisma.company.create({
      data: { name: companyName, currency: 'INR' },
    });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        name: userName,
        email,
        passwordHash,
        role: 'ADMIN',
      },
    });
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user, company });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user, company: user.company });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware(), (req, res) => {
  res.json({ user: req.user, company: req.user.company });
});

// User Management Routes
app.get('/api/users', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      include: { manager: true },
    });
    res.json(users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { name, email, password, role, managerId, isManagerApprover } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        companyId: req.user.companyId,
        name,
        email,
        passwordHash,
        role,
        managerId: managerId ? parseInt(managerId) : null,
        isManagerApprover: isManagerApprover || false,
      },
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/users/:id', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { role, managerId, isManagerApprover } = req.body;
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (managerId !== undefined) updateData.managerId = managerId ? parseInt(managerId) : null;
    if (isManagerApprover !== undefined) updateData.isManagerApprover = isManagerApprover;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Rule Management Routes
app.get('/api/rules', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const rules = await prisma.approvalRule.findMany({
      where: { companyId: req.user.companyId },
      include: { specificApprover: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rules', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { name, ruleType, percentageThreshold, specificApproverId } = req.body;
    const rule = await prisma.approvalRule.create({
      data: {
        companyId: req.user.companyId,
        name,
        ruleType,
        percentageThreshold: percentageThreshold ? parseInt(percentageThreshold) : null,
        specificApproverId: specificApproverId ? parseInt(specificApproverId) : null,
        isActive: true,
      },
      include: { specificApprover: { select: { id: true, name: true, email: true } } }
    });
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/rules/:id', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { isActive, name, ruleType, percentageThreshold, specificApproverId } = req.body;
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;
    if (ruleType !== undefined) updateData.ruleType = ruleType;
    if (percentageThreshold !== undefined) updateData.percentageThreshold = percentageThreshold ? parseInt(percentageThreshold) : null;
    if (specificApproverId !== undefined) updateData.specificApproverId = specificApproverId ? parseInt(specificApproverId) : null;

    const rule = await prisma.approvalRule.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { specificApprover: { select: { id: true, name: true, email: true } } }
    });
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/rules/:id', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    await prisma.approvalRule.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Currencies Route
let currencyCache = null;
app.get('/api/currencies', async (req, res) => {
  if (currencyCache) return res.json(currencyCache);
  try {
    const raw = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
    if (!raw.ok) throw new Error('API Failure');
    const data = await raw.json();
    const codesMap = new Map();
    data.forEach(country => {
       if (country.currencies) {
         Object.entries(country.currencies).forEach(([code, obj]) => {
            if (!codesMap.has(code)) codesMap.set(code, obj.name);
         });
       }
    });
    const result = Array.from(codesMap.entries()).map(([code, name]) => ({ code, name })).sort((a,b)=>a.code.localeCompare(b.code));
    currencyCache = result;
    res.json(result);
  } catch(err) {
    res.json([
      { code: 'USD', name: 'US Dollar' }, { code: 'INR', name: 'Indian Rupee' },
      { code: 'EUR', name: 'Euro' }, { code: 'GBP', name: 'British Pound' }
    ]);
  }
});

// Live Currency Conversion Route
app.get('/api/convert', authMiddleware([]), async (req, res) => {
  try {
    const { amount, from } = req.query;
    const to = req.user.company.currency || 'INR';
    const rate = await getExchangeRate(from, to);
    const converted = parseFloat(amount) * rate;
    res.json({ converted, rate, to });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Server-side OCR Fallback Endpoint
app.post('/api/expenses/ocr', authMiddleware([]), async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64' });
    
    // Tesseract.js recognizes base64 data URIs
    const result = await Tesseract.recognize(imageBase64, 'eng');
    res.json({ text: result.data.text });
  } catch (err) {
    res.status(500).json({ error: 'Server OCR failed: ' + err.message });
  }
});

// Expense Routes
app.post('/api/expenses', authMiddleware([]), async (req, res) => {
  try {
    const { submittedAmount, submittedCurrency, category, description, date, receiptImageUrl } = req.body;
    let initialStatus = 'APPROVED';
    
    // Calculate Multi-Currency Variables
    const companyCurrency = req.user.company.currency || 'INR';
    const rate = await getExchangeRate(submittedCurrency, companyCurrency);
    const companyAmount = parseFloat(submittedAmount) * rate;

    let manager = null;
    if (req.user.managerId) {
      manager = await prisma.user.findUnique({ where: { id: req.user.managerId } });
    }
    
    if (manager && manager.isManagerApprover) {
      initialStatus = 'IN_REVIEW';
    } else {
      initialStatus = 'PENDING';
    }

    const expense = await prisma.expense.create({
      data: {
        companyId: req.user.companyId,
        submittedById: req.user.id,
        amount: companyAmount,
        currency: companyCurrency, 
        submittedAmount: parseFloat(submittedAmount),
        submittedCurrency,
        companyAmount,
        companyCurrency,
        exchangeRate: rate,
        category,
        description,
        date: new Date(date),
        status: initialStatus,
        receiptImageUrl // OCR Integration
      },
    });

    if (manager && manager.isManagerApprover) {
      await prisma.approvalStep.create({
        data: {
          expenseId: expense.id,
          approverId: manager.id,
          sequence: 1,
          status: 'PENDING',
        },
      });
    }

    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/expenses', authMiddleware([]), async (req, res) => {
  try {
    let whereClause = { companyId: req.user.companyId };
    if (req.user.role === 'EMPLOYEE') {
      whereClause.submittedById = req.user.id;
    } else if (req.user.role === 'MANAGER') {
      const reports = await prisma.user.findMany({ where: { managerId: req.user.id } });
      const reportIds = reports.map(r => r.id);
      
      whereClause = {
        companyId: req.user.companyId,
        OR: [
          { submittedById: req.user.id },
          { submittedById: { in: reportIds } },
          { approvalSteps: { some: { approverId: req.user.id } } }
        ]
      };
    }
    
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      select: {
        id: true,
        companyId: true,
        submittedById: true,
        amount: true,
        currency: true,
        submittedAmount: true,
        submittedCurrency: true,
        companyAmount: true,
        companyCurrency: true,
        exchangeRate: true,
        category: true,
        description: true,
        date: true,
        status: true,
        createdAt: true,
        autoApprovedByRuleId: true,
        submitter: { select: { id: true, name: true, email: true } },
        approvalSteps: { include: { approver: { select: { id: true, name: true } } } },
        autoApprovedByRule: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(expenses);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/expenses/:id', authMiddleware([]), async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        submitter: { select: { id: true, name: true, email: true, role: true } },
        approvalSteps: {
          include: { approver: { select: { id: true, name: true, email: true } } },
          orderBy: { sequence: 'asc' }
        },
        autoApprovedByRule: true,
      },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/expenses/:id/approve', authMiddleware([]), async (req, res) => {
  try {
    const { action, comment } = req.body; 
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be APPROVE or REJECT.' });
    }

    const expenseId = parseInt(req.params.id);
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { approvalSteps: { orderBy: { sequence: 'asc' } } }
    });

    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    if (req.user.role === 'ADMIN') {
      const finalStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: finalStatus },
      });
      await prisma.approvalStep.updateMany({
         where: { expenseId, status: 'PENDING' },
         data: { status: finalStatus, comment: comment || 'Admin Override', decidedAt: new Date() }
      });
      return res.json({ success: true, message: 'Admin override executed' });
    }

    const pendingStep = expense.approvalSteps.find(s => s.status === 'PENDING' && s.approverId === req.user.id);
    if (!pendingStep) return res.status(403).json({ error: 'No pending action for you on this expense' });

    const stepStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await prisma.approvalStep.update({
      where: { id: pendingStep.id },
      data: {
        status: stepStatus,
        comment,
        decidedAt: new Date(),
      },
    });

    if (stepStatus === 'REJECTED') {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: 'REJECTED' },
      });
      return res.json({ success: true });
    } 

    const updatedExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { approvalSteps: true }
    });

    const activeRules = await prisma.approvalRule.findMany({
      where: { companyId: req.user.companyId, isActive: true }
    });

    let autoApprovedByRule = null;
    const totalSteps = updatedExpense.approvalSteps.length;
    const approvedSteps = updatedExpense.approvalSteps.filter(s => s.status === 'APPROVED');

    for (const rule of activeRules) {
      let ruleMet = false;
      const percentageMet = rule.percentageThreshold && ((approvedSteps.length / totalSteps) * 100) >= rule.percentageThreshold;
      const specificApproverMet = rule.specificApproverId && approvedSteps.some(s => s.approverId === rule.specificApproverId);

      if (rule.ruleType === 'PERCENTAGE' && percentageMet) ruleMet = true;
      else if (rule.ruleType === 'SPECIFIC_APPROVER' && specificApproverMet) ruleMet = true;
      else if (rule.ruleType === 'HYBRID' && (percentageMet || specificApproverMet)) ruleMet = true;

      if (ruleMet) {
        autoApprovedByRule = rule;
        break;
      }
    }

    if (autoApprovedByRule) {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: 'APPROVED', autoApprovedByRuleId: autoApprovedByRule.id },
      });
      return res.json({ success: true });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id }, include: { manager: true } });
    const nextManager = currentUser.manager;

    if (nextManager && nextManager.isManagerApprover) {
      await prisma.approvalStep.create({
        data: {
          expenseId: expense.id,
          approverId: nextManager.id,
          sequence: pendingStep.sequence + 1,
          status: 'PENDING'
        }
      });
    } else {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: 'APPROVED' },
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
