# PICBOX Full-Stack Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PICBOX SYSTEM                                 │
│                  Tablet-First Inventory Management                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React Native/Expo)                │
│                              ✅ 35% Complete                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📱 App.tsx (Entry Point)                                            │
│      │                                                                │
│      ├─► 🔐 RootNavigator                                           │
│      │      │                                                         │
│      │      ├─► Is Authenticated?                                    │
│      │      │     ├─ NO  ──► AuthNavigator (Login/Register)         │
│      │      │     └─ YES ──► MainNavigator (Bottom Tabs)            │
│      │      │                                                         │
│      │      └─► MainNavigator                                        │
│      │            ├─ 📊 Dashboard (Financial Metrics)               │
│      │            ├─ 📦 Products (Inventory)                        │
│      │            ├─ 👷 Employees (Wage Tracking)                   │
│      │            ├─ 💼 Jobs (Event Management)                     │
│      │            └─ ⚙️  Settings (Config)                          │
│      │                                                                │
│      ├─► 🎨 Theme System                                            │
│      │      ├─ Colors (Primary, Accent, Success, Error)             │
│      │      ├─ Typography (h1, h2, body, caption)                   │
│      │      ├─ Spacing (xs: 4px → xxl: 48px)                        │
│      │      └─ Shadows (small, medium, large)                        │
│      │                                                                │
│      ├─► 📦 State Management (Zustand)                              │
│      │      ├─ authStore (login, register, logout, loadUser)        │
│      │      ├─ productStore (CRUD operations)                        │
│      │      ├─ employeeStore (CRUD + recordPayment)                 │
│      │      ├─ jobStore (CRUD operations)                            │
│      │      └─ dashboardStore (financial metrics)                    │
│      │                                                                │
│      ├─► 🌐 API Integration Layer                                   │
│      │      ├─ client.ts (Axios + JWT Interceptor)                  │
│      │      ├─ auth.service.ts                                       │
│      │      ├─ product.service.ts                                    │
│      │      ├─ employee.service.ts                                   │
│      │      ├─ job.service.ts                                        │
│      │      └─ dashboard.service.ts                                  │
│      │                                                                │
│      ├─► 🧩 Reusable Components                                     │
│      │      ├─ Button (Primary/Secondary/Danger)                    │
│      │      ├─ Input (with validation)                               │
│      │      ├─ Card (container with shadow)                          │
│      │      └─ LoadingSpinner                                        │
│      │                                                                │
│      └─► 🔧 Utilities                                               │
│            ├─ storage.ts (AsyncStorage wrapper)                      │
│            ├─ secureStorage.ts (JWT token storage)                   │
│            └─ helpers.ts (formatters, validators)                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP/REST API
                                  │ JWT Authentication
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                       │
│                           ✅ 100% Complete                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🚀 index.js (Express Server)                                        │
│      │                                                                │
│      ├─► 🔐 Middleware                                              │
│      │      ├─ auth.js (JWT verification, admin check)              │
│      │      ├─ upload.js (Cloudinary integration)                    │
│      │      └─ validate.js (express-validator)                       │
│      │                                                                │
│      ├─► 🛣️  Routes (40+ endpoints)                                │
│      │      ├─ /api/auth (login, register, profile)                 │
│      │      ├─ /api/products (CRUD)                                  │
│      │      ├─ /api/employees (CRUD + recordPayment)                │
│      │      ├─ /api/jobs (CRUD + wage logic)                        │
│      │      ├─ /api/invoices (CRUD + PDF upload)                    │
│      │      ├─ /api/credentials (encrypted storage)                 │
│      │      ├─ /api/dashboard (financial aggregations)              │
│      │      └─ /api/upload (images + PDFs)                          │
│      │                                                                │
│      ├─► 🎮 Controllers                                             │
│      │      ├─ auth.controller.js                                    │
│      │      ├─ product.controller.js                                 │
│      │      ├─ employee.controller.js (⚠️ Wage logic)              │
│      │      ├─ job.controller.js (⚠️ Wage logic)                   │
│      │      ├─ invoice.controller.js                                 │
│      │      ├─ credential.controller.js (AES-256 encryption)        │
│      │      └─ dashboard.controller.js (aggregations)               │
│      │                                                                │
│      └─► 📊 Data Models (Mongoose)                                  │
│            ├─ User (auth)                                             │
│            ├─ Product (inventory)                                     │
│            ├─ Employee (pendingSalary, totalSalaryReceived)          │
│            ├─ Payment (wage records)                                  │
│            ├─ Job (assigned_employees, rented_items, expenses)       │
│            ├─ Invoice (brand_type, credentials)                      │
│            ├─ Credential (encrypted AES-256-CBC)                     │
│            └─ Counter (auto-increment IDs)                            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ MongoDB Wire Protocol
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE (MongoDB)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Collections:                                                         │
│    ├─ users                                                           │
│    ├─ products (productId auto-increment)                           │
│    ├─ employees (employeeId auto-increment)                         │
│    ├─ payments                                                        │
│    ├─ jobs (jobId auto-increment)                                    │
│    ├─ invoices (invoiceId auto-increment)                           │
│    ├─ credentials (encrypted bankDetails)                            │
│    └─ counters (sequence management)                                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ☁️  Cloudinary (File Storage)                                      │
│     ├─ Product images                                                │
│     ├─ Invoice PDFs                                                  │
│     └─ Other documents                                               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
                          CRITICAL BUSINESS LOGIC
                              ⚠️ Wage Tracking
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│  1️⃣  CREATE JOB (POST /api/jobs)                                    │
│      │                                                                │
│      ├─► User assigns employees with daily_wage                     │
│      │                                                                │
│      ├─► Backend creates job document                               │
│      │                                                                │
│      └─► Backend increments employee.pendingSalary                  │
│           ├─ Employee A: +500                                        │
│           ├─ Employee B: +600                                        │
│           └─ Employee C: +450                                        │
│                                                                       │
│  2️⃣  RECORD PAYMENT (POST /api/employees/:id/payments)              │
│      │                                                                │
│      ├─► User enters amount to pay                                  │
│      │                                                                │
│      ├─► Backend validates: amount ≤ pendingSalary                  │
│      │                                                                │
│      ├─► Backend decrements pendingSalary                           │
│      │                                                                │
│      ├─► Backend increments totalSalaryReceived                     │
│      │                                                                │
│      └─► Backend creates Payment record                             │
│                                                                       │
│  3️⃣  DELETE JOB (DELETE /api/jobs/:id)                              │
│      │                                                                │
│      ├─► Backend finds job with assigned employees                  │
│      │                                                                │
│      └─► Backend reverses wage increments                           │
│           ├─ Employee A: -500                                        │
│           ├─ Employee B: -600                                        │
│           └─ Employee C: -450                                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
                            DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════

SCENARIO: Creating a job for a wedding event

┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND (React Native)                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User fills Create Job form:                                         │
│    - Client: "Rajesh Kumar"                                          │
│    - Event Date: "2025-02-15"                                        │
│    - Assigned Employees:                                             │
│        • John (daily_wage: 500)                                      │
│        • Sarah (daily_wage: 600)                                     │
│    - Rented Items:                                                   │
│        • DJ Console (qty: 1, rate: 5000)                            │
│        • LED Wall (qty: 4, rate: 3000)                              │
│    - Expenses:                                                        │
│        • Transport: 2000                                             │
│        • Food: 1500                                                  │
│                                                                       │
│  jobStore.createJob(formData) ──────────────┐                       │
│                                               │                       │
└───────────────────────────────────────────────┼───────────────────────┘
                                                │
                                                │ POST /api/jobs
                                                │ Authorization: Bearer <JWT>
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND (Node.js + Express)                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  job.controller.js → createJob()                                     │
│                                                                       │
│  1. Validate request data                                            │
│  2. Start MongoDB transaction                                        │
│  3. Calculate total_cost:                                            │
│       - Rented items: (1×5000) + (4×3000) = 17,000                 │
│       - Expenses: 2000 + 1500 = 3,500                               │
│       - Wages: 500 + 600 = 1,100                                    │
│       - TOTAL: 21,600                                                │
│  4. Create Job document                                              │
│  5. For each assigned employee:                                      │
│       - Find employee document                                       │
│       - Increment pendingSalary by daily_wage                        │
│       - Save employee                                                │
│  6. Commit transaction                                               │
│  7. Return job document                                              │
│                                                                       │
└───────────────────────────────────────────────┬───────────────────────┘
                                                │
                                                │ 200 OK { job: {...} }
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND (React Native)                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  jobStore updates state:                                             │
│    - Add new job to jobs array                                       │
│    - Show success message                                            │
│    - Navigate to job detail screen                                  │
│                                                                       │
│  employeeStore.fetchEmployees() ─────────────┐                      │
│    (to refresh wage balances)                 │                      │
│                                               │                       │
└───────────────────────────────────────────────┼───────────────────────┘
                                                │
                                                │ GET /api/employees
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND → Returns updated employee list with new pendingSalary      │
└─────────────────────────────────────────────────────────────────────┘

RESULT:
  • Job created: Job #101
  • John's pendingSalary: 2,500 → 3,000 (+500)
  • Sarah's pendingSalary: 1,200 → 1,800 (+600)
  • Dashboard profit: Updated to reflect new expenses/wages
  • User sees: "Job created successfully!"

═══════════════════════════════════════════════════════════════════════
                          DEPLOYMENT ARCHITECTURE
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  📱 Android Tablet (APK)                                             │
│      │                                                                │
│      └─► Expo-built React Native app                                │
│          ├─ No Play Store required                                  │
│          ├─ Direct APK installation                                 │
│          └─ Optimized for tablet form factor                        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  🌐 Render.com (Backend Hosting)                                    │
│      │                                                                │
│      ├─► Free tier                                                   │
│      ├─► Auto-sleep after 15 min inactivity                         │
│      ├─► Environment variables for secrets                           │
│      └─► Automatic deployments from Git                             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ MongoDB Connection String
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  🗄️  MongoDB Atlas (Database)                                       │
│      │                                                                │
│      ├─► Free M0 cluster (512MB)                                    │
│      ├─► Automatic backups                                          │
│      └─► Global distribution                                         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ☁️  Cloudinary (CDN)                                               │
│      │                                                                │
│      ├─► Free tier (25GB storage)                                   │
│      ├─► Image transformations                                       │
│      └─► Fast CDN delivery                                           │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
                              FILE COUNTS
═══════════════════════════════════════════════════════════════════════

Backend:  30+ files (Complete)
  ├─ Models: 8
  ├─ Controllers: 8
  ├─ Routes: 8
  ├─ Middleware: 3
  ├─ Tests: 2
  └─ Documentation: 4

Frontend: 35+ files (Foundation Complete)
  ├─ API Services: 6
  ├─ State Stores: 4
  ├─ Navigation: 4
  ├─ Screens: 7 (placeholders)
  ├─ Components: 4
  ├─ Utilities: 3
  ├─ Theme: 1
  ├─ Types: 2
  └─ Documentation: 2

Total Lines of Code: ~8,000+ (Backend) + ~2,500+ (Frontend) = 10,500+

═══════════════════════════════════════════════════════════════════════
                           DEVELOPMENT STATUS
═══════════════════════════════════════════════════════════════════════

Backend:  ████████████████████████████████  100% ✅
Frontend: ██████████░░░░░░░░░░░░░░░░░░░░░░   35% 🔄
Testing:  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░   15% ⏳
APK:      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    0% ⏳

Overall:  ███████████░░░░░░░░░░░░░░░░░░░░░   40% 🚀

Next Milestone: Login Screen + Dashboard (Target: 55%)

═══════════════════════════════════════════════════════════════════════
