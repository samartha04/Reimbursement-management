# Reimbursement Management System

## Setup Instructions

### 1. Database and Backend Initialization
Open a terminal in the `backend` folder and run the following:
```bash
cd backend
npm install
npx prisma migrate dev --name init
node seed.js
```

To run the backend development server:
```bash
node index.js
```
The server will start on `http://localhost:3001`

### 2. Frontend Initialization
Open a second terminal in the `frontend` folder and run the following:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`

## Demo Credentials
All users have the password: `demo1234`
- **Admin**: admin@demo.com
- **Manager**: manager@demo.com
- **Employee**: employee@demo.com
