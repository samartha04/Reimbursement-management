# ExpenseFlow — Enterprise Reimbursement Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![React](https://img.shields.io/badge/frontend-React_%7C_Vite-61DAFB.svg?logo=react)
![Node](https://img.shields.io/badge/backend-Node.js_%7C_Express-339933.svg?logo=node.js)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748.svg?logo=prisma)

A production-ready, multi-tier expense reimbursement platform designed to streamline corporate expense approvals. Features dynamic approval chains, role-based access control, automated OCR receipt scanning, and multi-currency support.

## ✨ Features

- 🔐 **Role-Based Access Control (RBAC):** Distinct workspaces for Admin, Manager, and Employee tiers.
- ⚙️ **Dynamic Approval Chains:** Expenses automatically route up the management hierarchy based on custom company structures.
- 📐 **Conditional Approval Rules:** Configure percentage thresholds, precise approver bypass mechanisms, and hybrid rule evaluations.
- 💱 **Multi-Currency Support:** Submit claims in 160+ currencies with real-time conversion matching company base currency.
- 📄 **Intelligent OCR Scanning:** Upload receipts to automatically extract amounts, dates, merchants, and categories via Tesseract OCR.
- 🔔 **Real-Time Notifications:** In-app notification bell delivering instant updates for approvals, rejections, and review requests.
- 👩‍🚀 **Admin Workspace:** Comprehensive dashboard to manage users, roles, organizational reporting lines, and complex approval rules.
- 🎨 **Premium UI/UX:** Built with Tailwind CSS, featuring skeleton loaders, empty states, receipt lightboxes, and visual status indicators.

## 🛠️ Technology Stack

| Architecture Layer | Technologies & Tools |
|--------------------|----------------------|
| **Frontend** | React, Vite, Tailwind CSS, Lucide React, Tesseract.js |
| **Backend** | Node.js, Express, JSON Web Tokens (JWT), bcryptjs |
| **Database** | SQLite, Prisma ORM |
| **External APIs** | exchangerate-api.com, restcountries.com |

## 🚀 Quick Start

### 1. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend

# Install dependencies
npm install

# Initialize Prisma ORM and SQLite Database
npx prisma migrate dev --name init

# Seed the database with sample organizational data
node seed.js

# Start the development server (runs on port 3001)
npm run dev
```

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server (runs on port 5173 by default)
npm run dev
```

## 🔐 Demo Verification & Credentials

The `seed.js` script initializes a mock company ("TechCorp India") with pre-configured users and 4 sample expenses showing various states (Approved, Rejected, Pending Review). 

Log in to the frontend app using the following test credentials to explore different organizational perspectives:

| Role Level | Email Address | Password |
|------------|---------------|----------|
| **Admin** | `admin@expenseflow.com` | `demo1234` |
| **Director** | `director@expenseflow.com` | `demo1234` |
| **Manager** | `manager@expenseflow.com` | `demo1234` |
| **Employee** | `employee@expenseflow.com` | `demo1234` |

*Demo Scenarios included: Travel claim (Completed 2-step chain), Food claim (Rejected with comment), Accommodation claim (Waiting on Director), Equipment claim (Waiting on Manager).*

## ⚙️ Environment Configuration

Ensure the backend has the proper environment variables defined. Create a `.env` file in the `/backend` directory:

```env
# backend/.env

# Prisma Database URL (SQLite)
DATABASE_URL="file:./dev.db"

# JWT Secret for Authentication Signing
JWT_SECRET="super-secret-key-change-in-production"

# Backend Server Port
PORT=3001


