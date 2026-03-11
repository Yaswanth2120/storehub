# StoreHub

StoreHub is a full-stack store operations dashboard built with Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL, and NextAuth. It supports multi-store access control, employee management, attendance tracking, payroll reporting, and role-based restrictions for Owners, Co-Owners, and Managers.

## Tech Stack

- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn-style UI components, React Hook Form, Zod, Sonner, Lucide React
- Backend: Next.js Route Handlers, Prisma ORM, NextAuth credentials auth, JWT sessions
- Database: PostgreSQL (tested with Neon)
- Deployment target: Vercel

## Project Structure

```text
storehub/
├── frontend/              # UI layer: components, forms, layout, modals, pages, providers
├── backend/               # Server/business layer: auth, data access, validation, Prisma client
├── prisma/                # Prisma schema and seed script
├── public/                # Static assets
├── src/app/               # Next.js route layer (pages, layouts, API routes)
├── src/lib/               # Shared utilities
├── src/types/             # Type augmentations
├── middleware.ts          # Route protection and role redirects
└── README.md
```

`src/app` is intentionally thin. The actual frontend lives in `frontend/` and the actual server logic lives in `backend/`.

## Core Features

- Credentials-based authentication with forced password change flow
- Role-based navigation and route protection
- Store management with store assignment rules
- Employee directory with management staff also visible in the listing
- Attendance tracking with manager date restrictions
- Payroll reporting with store and date-range filters
- User management for Co-Owners and Managers
- Settings page with Owner edit access and Co-Owner read-only access
- Prisma seed data for quick local testing

## Roles and Restrictions

### Owner

- Full access to Stores, Employees, Attendance, User Management, Payroll, and Settings
- Can create, edit, and delete stores and employees
- Can create, edit, delete, and reset passwords for Co-Owners and Managers
- Can edit system settings
- Can view all stores and all data

### Co-Owner

- Access limited to assigned stores only
- Can view Stores, Employees, Attendance, Payroll, and Settings
- Can create and manage employees in assigned stores
- Can create attendance records for assigned stores
- Can view Settings in read-only mode
- Cannot access User Management

### Manager

- Access limited to Stores, Employees, and Attendance
- Stores and Employees are read-only
- Can create attendance only for allowed historical dates
- Cannot access Payroll, User Management, or Settings
- Attendance entry is restricted to the configured `pastDaysAllowed` window

## Demo Accounts

These are loaded by the seed script:

- `owner / owner123`
- `coowner1 / temp123`
- `sarah.j / temp123`
- `michael.c / manager123`

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://username:password@host.neon.tech/storehub?sslmode=require"
NEXTAUTH_SECRET="replace-with-a-secure-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Notes:

- `DATABASE_URL` should be your real PostgreSQL/Neon connection string
- `NEXTAUTH_SECRET` should be a long random string
- update `NEXTAUTH_URL` if you run on a different port locally

## Getting Started Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the environment

Create `.env` and fill in:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Push the schema to the database

```bash
npx prisma db push
```

### 5. Seed demo data

```bash
npx prisma db seed
```

### 6. Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Available Scripts

- `npm run dev` - start the local dev server
- `npm run build` - create a production build
- `npm run start` - run the production build
- `npm run lint` - run ESLint
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:push` - push Prisma schema to the database
- `npm run prisma:seed` - seed demo data

## Seeded Data

The seed script creates:

- 4 demo users
- 3 stores
- 4 employees
- attendance records covering the last 7 days
- default system settings

## Authentication Flow

- Users sign in with username and password
- Sessions are stored as JWTs with role and store assignment metadata
- Protected routes are enforced with middleware
- Owners can reset their own password with username + recovery email, while co-owners/managers use owner-issued temporary passwords and can change them later from Settings

## Payroll Behavior

- Payroll is calculated from attendance and employee pay rates
- Owners and Co-Owners can filter by store and date range
- Managers cannot access Payroll

## Deployment Notes

This project is designed for Vercel deployment.

Before deploying:

1. Create a production PostgreSQL/Neon database
2. Set production environment variables in Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
3. Run the Prisma schema against the production database

Recommended production flow:

1. Push code to GitHub
2. Import the repo into Vercel
3. Add environment variables in Vercel
4. Run `npx prisma db push` against the production database

## Security Notes

- Passwords are hashed with bcrypt before storage
- Passwords are never returned in API responses
- `.env` should never be committed
- If a database credential is ever exposed, rotate it immediately

## Current Implementation Notes

- Management users appear in the employee directory for visibility
- Payroll supports date-range filtering and filtered totals by period
- The route layer is intentionally separated from the real frontend/backend code for maintainability
