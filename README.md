# Merlin Platform

A secure, enterprise-grade full-stack web application designed to manage the generation and validation of drug integrity certificates. Built with strict TypeScript typing, a dark hacker-inspired styling system, role-based access control, and a dynamic verification audit log.

## 🏗️ Project Architecture

This project is organized as a monorepo consisting of the following key directories:

*   **/client**: React 19 (Vite) + TypeScript + Tailwind CSS v4 frontend.
*   **/server**: Node.js + Express.js + TypeScript backend.
*   **/supabase**: Supabase database schema migrations and configurations.

```
drugtest/
├── client/              # React Frontend
│   ├── src/
│   │   ├── components/  # Reusable UI Components
│   │   ├── context/     # Auth Context & State Managers
│   │   ├── pages/       # Screen views (Landing, Login, Register, Dashboard, Verify, Admin)
│   │   ├── services/    # Axios and Supabase clients
│   │   ├── App.tsx      # Routing and Guard configurations
│   │   └── index.css    # Tailwind CSS v4 config and custom variables
│   └── vite.config.ts   # Vite bundler options
│
├── server/              # Express Backend
│   ├── src/
│   │   ├── db/          # Supabase client instantiation
│   │   ├── middleware/  # Auth checking & File upload validation
│   │   ├── routes/      # Routers (auth, admin, documents, verify)
│   │   ├── utils/       # Winston logger & naming formatters
│   │   └── index.ts     # Express server bootstrap
│   └── templates/       # The Core HTML template engine (certificate.html)
│
└── supabase/            # Supabase Postgres migrations
    └── migrations/      # Ordered migration files (.sql)
```

---

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   npm (v9+)
*   A Supabase project (for Authentication, Database, and Storage)

---

### 1. Database Configuration (Supabase)

1.  Log in to your [Supabase Dashboard](https://supabase.com).
2.  Navigate to your SQL Editor and execute the schema definitions inside `/supabase/migrations/20260711000000_init.sql`.
    *   This creates the `profiles`, `activation_keys`, `drug_tests`, `settings`, and `verification_logs` tables.
    *   This configures the sync triggers between `auth.users` and `public.profiles`.
    *   This enables Row-Level Security (RLS) policies on all tables.
3.  **Storage Setup:** Ensure you create a public bucket named `passports` in your Supabase Storage console, or let the backend server auto-create it on startup (using service role).
4.  **Admin Provisioning:** When you register a user with email `admin@drugtest.com`, their profile role is automatically set to `'admin'` if you insert them or manually update their role field inside the `profiles` table to `'admin'`.

---

### 2. Backend Server Setup (`/server`)

1.  Change directory to `server`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure variables in a `.env` file (copied from `.env.example`):
    ```env
    PORT=5000
    NODE_ENV=development
    SUPABASE_URL=https://your-project-id.supabase.co
    SUPABASE_ANON_KEY=your-supabase-anon-key
    SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
    JWT_SECRET=your-jwt-signing-secret-key-at-least-32-chars
    FRONTEND_URL=http://localhost:5173
    ```
4.  Start development server:
    ```bash
    npm run dev
    ```

---

### 3. Frontend Client Setup (`/client`)

1.  Change directory to `client`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure variables in a `.env.local` file (copied from `.env.example`):
    ```env
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    VITE_API_URL=http://localhost:5000/api
    ```
4.  Start development server:
    ```bash
    npm run dev
    ```

---

## 🔒 Security Measures

*   **Rate Limiting:** Protects server endpoints from brute-force requests.
*   **Security Headers:** Express app is protected using Helmet.
*   **Input Validation:** Form payloads are validated via Zod.
*   **Access Control:** Custom middleware validates session tokens against Supabase Auth, blocking suspended profiles and restricting administrative endpoints.
*   **File Upload Sanitization:** File validation restricts passport image uploads to MIME types (JPG, JPEG, PNG) and sizes under 5MB.
