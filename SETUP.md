# Government Transparency Platform — Setup Guide

## Prerequisites
- Node.js 18+
- A Supabase account (free tier works)

---

## 1. Supabase Setup

### 1.1 Create Project
1. Go to https://supabase.com → New Project
2. Note your **Project URL** and **Anon Key** from Settings → API

### 1.2 Run Database Schema
1. Open Supabase Dashboard → SQL Editor → New Query
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

This creates:
- All tables (profiles, departments, projects, complaints, responses, complaint_timeline)
- All enums (user_role, complaint_status, project_status)
- RLS policies for data security
- Triggers for auto-updating timestamps and timeline logging
- Seed data (6 departments)

### 1.3 Enable Email Auth
1. Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. For development: disable "Confirm email" requirement
   - Authentication → Settings → Disable "Enable email confirmations"

---

## 2. Local Development

### 2.1 Configure Environment
```bash
cd app
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2.2 Install Dependencies
```bash
cd app
npm install
```

### 2.3 Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

---

## 3. Create Test Users

### Option A: Register via UI
1. Go to http://localhost:3000/auth/register
2. Create three accounts:
   - **Admin**: any email, role = Admin (contact Supabase to manually set role after registration)
   - **Official**: any email, role = Official
   - **Citizen**: any email, role = Citizen

### Option B: Supabase Dashboard (Recommended)
1. Create users in Authentication → Users
2. Then run in SQL Editor to set roles:

```sql
-- Create admin user (after they register)
UPDATE profiles SET role = 'Admin' WHERE email = 'admin@yourdomain.com';

-- Create official user and assign to department
UPDATE profiles
SET role = 'Official',
    department_id = (SELECT department_id FROM departments WHERE department_name = 'Ministry of Finance')
WHERE email = 'official@yourdomain.com';
```

### Option C: Seed Script (SQL)
```sql
-- Add users directly (make sure they've registered first)
-- Then update their roles via the Admin UI at /admin/users
```

---

## 4. Platform URLs

| Role | URL | Features |
|------|-----|---------|
| Public | `/` | Home, About, Departments, Projects |
| Citizen | `/citizen/dashboard` | Submit & track complaints |
| Official | `/official/dashboard` | Review & process complaints |
| Admin | `/admin/dashboard` | Full system management |

---

## 5. Production Deployment (Vercel)

### 5.1 Deploy
```bash
# Install Vercel CLI
npm i -g vercel

cd app
vercel deploy
```

### 5.2 Set Environment Variables
In Vercel Dashboard → Project → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 5.3 Update Supabase CORS
In Supabase → Settings → API:
- Add your Vercel domain to allowed origins

---

## 6. Architecture Overview

```
Government Transparency Platform
├── Frontend (Next.js 16, App Router)
│   ├── Public Pages: /, /about, /departments, /projects
│   ├── Auth Pages: /auth/login, /auth/register
│   ├── Citizen Portal: /citizen/*
│   ├── Official Portal: /official/*
│   └── Admin Portal: /admin/*
│
├── Backend (Supabase)
│   ├── PostgreSQL Database
│   ├── Row Level Security (RLS)
│   ├── Auth (JWT + Session)
│   └── Realtime (available for future use)
│
└── Security
    ├── Middleware route protection
    ├── Server-side authorization
    ├── Zod input validation
    └── RLS database policies
```

---

## 7. Complaint State Machine

```
Submitted → UnderReview → PendingInfo → UnderReview → InProgress → Resolved → Closed
                        ↓                             ↓
                     Rejected                      Escalated → Resolved
                                                               ↓
                                                            Reopened → InProgress
```

**State Transitions:**
| From | Action | To | Who |
|------|--------|-----|-----|
| Submitted | Begin Review | UnderReview | Official |
| Submitted | Reject | Rejected | Official |
| UnderReview | Request Info | PendingInfo | Official |
| UnderReview | Validate | InProgress | Official |
| UnderReview | Reject | Rejected | Official |
| PendingInfo | Submit Info | UnderReview | Citizen |
| InProgress | Resolve | Resolved | Official |
| InProgress | Escalate | Escalated | Official |
| Escalated | Take Action | InProgress | Admin |
| Resolved | Close | Closed | Citizen |
| Resolved | Reopen | Reopened | Citizen |
| Reopened | Reinvestigate | InProgress | Official |

---

## 8. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | ShadCN UI (Base UI primitives) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Validation | Zod v4 |
| Icons | Lucide React |

---

## 9. Security Features

- **Row Level Security**: Each role only sees authorized data
- **Middleware Protection**: Routes are protected at the edge
- **Server Actions**: All mutations happen server-side
- **Input Validation**: Zod schemas on all user inputs
- **CSRF Protection**: Built into Next.js Server Actions
- **Password Security**: Handled by Supabase Auth (bcrypt)

---

## 10. Future Enhancements

- [ ] Real-time complaint status updates (Supabase Realtime)
- [ ] Email notifications for status changes
- [ ] File attachments for complaints (Supabase Storage)
- [ ] SLA tracking and automated escalation
- [ ] Public API for third-party transparency portals
- [ ] Advanced analytics with charts (recharts integration)
- [ ] Multi-language support (i18n)
- [ ] Department-level SLA configuration
- [ ] Complaint reassignment between officials
- [ ] Audit log export for compliance
