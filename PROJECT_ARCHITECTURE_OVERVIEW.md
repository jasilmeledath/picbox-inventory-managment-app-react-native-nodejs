# PICBOX Inventory Management System
## Complete Architecture & Code Analysis

---

## 📋 Executive Summary

**Project Name:** PicBox - Sound Rental Inventory Management System  
**Tech Stack:** React Native (Expo) + Node.js (Express) + MongoDB Atlas  
**Deployment:** Render.com (Backend) | Expo Go / APK (Mobile)  
**Purpose:** Complete business management solution for sound/lighting equipment rental companies operating under two brands: **Picbox** and **Echo Sounds**

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Navigation Layer (React Navigation)                 │   │
│  │  • Auth Stack (Login/Register)                       │   │
│  │  • Main Tab Navigator (Dashboard, Products, etc.)    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State Management (Zustand)                          │   │
│  │  • Auth Store • Product Store • Employee Store        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Client (Axios)                                  │   │
│  │  • JWT Token Management • Request Interceptors       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (Node.js + Express)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware Layer                                    │   │
│  │  • JWT Auth • Upload (Multer) • Validation           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controllers (Business Logic)                        │   │
│  │  • Auth • Products • Employees • Jobs • Invoices     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Models (Mongoose ODM)                               │   │
│  │  • User • Product • Employee • Job • Invoice         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  External Services                                   │   │
│  │  • Cloudinary (File Storage) • Puppeteer (PDF Gen)   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ MongoDB Wire Protocol
┌─────────────────────────────────────────────────────────────┐
│            DATABASE (MongoDB Atlas - Cloud)                 │
│  Collections: users, products, employees, jobs, invoices,   │
│               payments, credentials, company_credentials    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema & Relationships

### Core Collections

#### 1. **Users** (Authentication)
```javascript
{
  email: String (unique, indexed),
  passwordHash: String (bcrypt hashed),
  name: String,
  isAdmin: Boolean,
  refreshToken: String,
  timestamps: { createdAt, updatedAt }
}
```

#### 2. **Products** (Inventory Items)
```javascript
{
  sku: String (optional, sparse index),
  name: String (required, text indexed),
  description: String,
  purchase_type: 'new' | 'existing',
  purchase_cost: Number (required if purchase_type === 'new'),
  timestamps: { createdAt, updatedAt }
}
```
**Business Rule:** `purchase_cost` tracks capital expenses for new product purchases only.

#### 3. **Employees** (Staff/Wage Tracking)
```javascript
{
  employeeId: Number (auto-increment, unique),
  name: String (required, text indexed),
  role: String,
  phone: String,
  totalSalaryReceived: Number (default: 0),
  pendingSalary: Number (default: 0),
  timestamps: { createdAt, updatedAt }
}
```
**Business Rule:** `pendingSalary` auto-increments when assigned to jobs, decrements on payment recording.

#### 4. **Jobs** (Events/Projects)
```javascript
{
  title: String (required),
  date: Date (required, indexed),
  assigned_employees: [{
    employee_id: ObjectId (ref: Employee),
    name: String,
    role: String,
    daily_wage: Number (required),
    wage_status: 'pending' | 'paid'
  }],
  rented_items: [{
    product_id: ObjectId (ref: Product),
    name: String,
    qty: Number,
    rate: Number
  }],
  expenses: [{
    type: 'transport' | 'food' | 'misc',
    amount: Number,
    date: Date,
    notes: String
  }],
  status: 'planned' | 'in-progress' | 'completed',
  total_cost: Number (auto-calculated),
  timestamps: { createdAt, updatedAt }
}
```
**Critical Business Logic:**
- **On Job Create:** Increments each assigned employee's `pendingSalary` by their `daily_wage`
- **On Job Update:** Reverses old wages, applies new wages
- **On Job Delete:** Reverses pending wages (prevents negative values)
- **total_cost = sum(wages) + sum(rental_items × rate) + sum(expenses)**

#### 5. **Invoices** (Customer Billing)
```javascript
{
  invoice_number: Number (auto-increment, unique),
  brand_type: 'Picbox' | 'Echo',
  customer_name: String (required, text indexed),
  event_name: String,
  rented_items: [{
    product_id: ObjectId (ref: Product),
    name: String,
    qty: Number,
    rate: Number
  }],
  subtotal: Number,
  discount: Number,
  discount_percentage: Number (0-100),
  total_amount: Number,
  paid_amount: Number,
  pending_amount: Number (auto-calculated: total - paid),
  status: 'draft' | 'estimate' | 'final',
  date: Date (indexed),
  pdf: {
    url: String,
    public_id: String
  },
  company_credentials: ObjectId (ref: CompanyCredential),
  timestamps: { createdAt, updatedAt }
}
```

#### 6. **Payments** (Employee Payment History)
```javascript
{
  employee_id: ObjectId (ref: Employee, indexed),
  amount: Number,
  date: Date (indexed),
  method: 'cash' | 'bank_transfer' | 'upi' | 'other',
  notes: String,
  recorded_by: ObjectId (ref: User),
  timestamps: { createdAt, updatedAt }
}
```

#### 7. **CompanyCredential** (Brand Details for Invoices)
```javascript
{
  company_name: 'Picbox' | 'Echo' (unique),
  display_name: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String
  },
  contact: {
    primary_phone: String,
    alternate_phone: String,
    email: String
  },
  bank_details: {
    account_name: String,
    account_number: String,
    ifsc_code: String,
    bank_name: String,
    branch: String
  },
  upi_details: {
    upi_id: String,
    google_pay_number: String,
    payee_name: String
  },
  tax_details: {
    gstin: String,
    pan: String
  },
  logo: {
    url: String,
    public_id: String
  },
  is_active: Boolean,
  notes: String,
  timestamps: { createdAt, updatedAt }
}
```
**Usage:** Populates invoice PDFs with company-specific branding, bank/UPI details, and generates QR codes for UPI payments.

#### 8. **Counter** (Auto-Increment IDs)
```javascript
{
  _id: String ('employeeId' | 'invoice'),
  sequence_value: Number
}
```
**Pattern:** MongoDB doesn't have native auto-increment. This collection implements atomic auto-increment for `employeeId` and `invoice_number`.

---

## 🔐 Authentication & Security

### JWT Token Flow
1. **Login:** User submits email/password
2. **Backend:** Validates credentials, generates `accessToken` (15m expiry) + `refreshToken` (7d expiry)
3. **Client:** Stores tokens in `SecureStore` (Expo)
4. **Requests:** Axios interceptor attaches `Authorization: Bearer {accessToken}` header
5. **Token Refresh:** On 401 error, client auto-calls `/api/auth/refresh` with `refreshToken`
6. **Logout:** Clears tokens from storage

### Security Features
- **Password Hashing:** bcrypt (10 salt rounds)
- **Encrypted Storage:** User credentials stored with AES-256-CBC encryption
- **Rate Limiting:** Express Rate Limiter on auth endpoints
- **Helmet.js:** Security headers (XSS, CSRF protection)
- **CORS:** Configured for production domain
- **Input Validation:** express-validator on all endpoints

---

## 🔄 Key Business Flows

### Flow 1: Employee Wage Management
```
┌────────────────────────────────────────────────────────────┐
│ 1. Admin creates Job with assigned employees              │
│    • Job: "Wedding Event" on 2024-03-15                   │
│    • Assign: John (daily_wage: ₹1500)                     │
│                                                            │
│ 2. Backend (job.controller.js → createJob)                │
│    a. Create Job document                                 │
│    b. Find Employee "John" in database                    │
│    c. Increment: John.pendingSalary += 1500               │
│    d. Save Employee document                              │
│                                                            │
│ 3. Admin records payment (₹1500)                          │
│    • POST /api/employees/:id/payments                     │
│                                                            │
│ 4. Backend (employee.controller.js → recordPayment)       │
│    a. Validate: amount <= pendingSalary                   │
│    b. Create Payment record                               │
│    c. John.pendingSalary -= 1500                          │
│    d. John.totalSalaryReceived += 1500                    │
│    e. Save Employee document                              │
│                                                            │
│ 5. Dashboard shows:                                       │
│    • Pending Wages: ₹0                                    │
│    • Total Paid: ₹1500                                    │
└────────────────────────────────────────────────────────────┘
```

**Edge Cases Handled:**
- Job deletion reverses pending wages
- Job update: reverses old wages, applies new wages
- Payment validation: cannot pay more than pending amount
- Prevents negative pending salary (seeded data safety)

### Flow 2: Invoice Generation with PDF & UPI QR Code
```
┌────────────────────────────────────────────────────────────┐
│ 1. Admin creates invoice (Mobile App)                     │
│    • Brand: "Picbox"                                       │
│    • Customer: "ABC Corp"                                  │
│    • Items: 2× Speakers @ ₹5000 each                      │
│    • Discount: 10%                                         │
│    • Paid: ₹5000                                           │
│                                                            │
│ 2. Backend (invoice.controller.js → createInvoice)        │
│    • Calculate subtotal: 2 × 5000 = ₹10,000               │
│    • Calculate discount: 10% of 10000 = ₹1,000            │
│    • Total: ₹9,000                                         │
│    • Pending: ₹9,000 - ₹5,000 = ₹4,000                    │
│    • Auto-assign invoice_number: 1001 (from Counter)      │
│    • Save Invoice document                                │
│                                                            │
│ 3. User clicks "Generate PDF" button                      │
│    • GET /api/invoices/:id/generate-pdf                   │
│                                                            │
│ 4. Backend (invoice.controller.js → generatePDF)          │
│    • Fetch Invoice from DB                                │
│    • Fetch CompanyCredential for "Picbox" brand           │
│    • Call pdfGenerator.generateInvoicePDF()               │
│                                                            │
│ 5. PDF Generator (pdfGenerator.js)                        │
│    a. Generate HTML template with:                        │
│       - Company logo (base64 encoded)                     │
│       - Invoice details table                             │
│       - Bank details (if status === 'final')              │
│    b. Generate UPI QR Code (if pending > 0 & final)       │
│       - UPI URI: upi://pay?pa=upiid&pn=name&am=4000       │
│       - QR Code as base64 data URL                        │
│    c. Launch Puppeteer (headless Chrome)                  │
│       - Timeout: 120s (Render.com cold start)             │
│       - Args: --no-sandbox, --disable-setuid-sandbox      │
│    d. Set HTML content with 'domcontentloaded' wait       │
│    e. Generate PDF buffer (A4 format, print backgrounds)  │
│    f. Close browser                                       │
│                                                            │
│ 6. Backend sends PDF directly to client                   │
│    • Content-Type: application/pdf                        │
│    • Content-Disposition: attachment; filename=...        │
│    • Response: PDF buffer (binary)                        │
│                                                            │
│ 7. Mobile App (React Native)                              │
│    • Download PDF via expo-file-system                    │
│    • Save to device local storage                         │
│    • Share via expo-sharing (WhatsApp, Email, etc.)       │
└────────────────────────────────────────────────────────────┘
```

**Key Implementation Details:**
- **Puppeteer Chrome Path:** Auto-detected via `puppeteer.executablePath()` on Render
- **PDF Generation Timeout:** 120 seconds (handles Render free tier cold starts)
- **QR Code Library:** `qrcode` npm package
- **Logo Embedding:** Read from `backend/assets/logos/`, convert to base64
- **Status Logic:** Only 'final' invoices show bank/UPI details and QR codes

### Flow 3: Dashboard Financial Calculations
```
┌────────────────────────────────────────────────────────────┐
│ Dashboard Aggregation (dashboard.controller.js)           │
│                                                            │
│ 1. Total Revenue                                           │
│    • Sum of all Invoice.total_amount (status: final)      │
│    • MongoDB Aggregation: $match + $group                 │
│                                                            │
│ 2. Total Expenses                                          │
│    a. Wages Paid:                                          │
│       - Sum of all Payment.amount                         │
│    b. Job Expenses:                                        │
│       - Sum of all Job.expenses.amount                    │
│    c. Product Purchases:                                   │
│       - Sum of Product.purchase_cost (purchase_type: new) │
│    • Total Expenses = (a) + (b) + (c)                     │
│                                                            │
│ 3. Net Profit/Loss                                         │
│    • Profit = Total Revenue - Total Expenses              │
│    • Display with color: Green (profit) / Red (loss)      │
│                                                            │
│ 4. Pending Wages                                           │
│    • Sum of all Employee.pendingSalary                    │
│                                                            │
│ 5. Pending Invoice Amounts                                │
│    • Sum of all Invoice.pending_amount (status: final)    │
│                                                            │
│ 6. Summary Cards                                           │
│    • Total Employees: Count of Employee documents         │
│    • Total Products: Count of Product documents           │
│    • Active Jobs: Count of Job (status: in-progress)      │
│    • Recent Invoices: Last 5 invoices (sorted by date)    │
└────────────────────────────────────────────────────────────┘
```

**Caching Strategy:** Dashboard data recalculated on every request (no caching) to ensure real-time accuracy.

---

## 🎨 Frontend Architecture (React Native + Expo)

### Tech Stack
- **Framework:** React Native 0.81.4 + Expo SDK 54
- **Navigation:** React Navigation 7 (Native Stack + Bottom Tabs)
- **State Management:** Zustand 5.0.8
- **Form Handling:** React Hook Form 7.63 + Yup validation
- **UI Library:** React Native Paper 5.14.5
- **HTTP Client:** Axios 1.12.2
- **Storage:** AsyncStorage (config) + SecureStore (tokens)
- **File Operations:** expo-file-system, expo-sharing

### Screen Structure
```
App.tsx (Root)
  └─ RootNavigator
      ├─ AuthStack (if not authenticated)
      │   ├─ LoginScreen
      │   └─ RegisterScreen
      │
      └─ MainTabNavigator (if authenticated)
          ├─ DashboardTab
          │   └─ DashboardScreen (Summary cards, charts)
          │
          ├─ ProductsTab
          │   ├─ ProductListScreen (Search, filter)
          │   ├─ ProductDetailScreen
          │   └─ ProductFormScreen (Create/Edit)
          │
          ├─ EmployeesTab
          │   ├─ EmployeeListScreen
          │   ├─ EmployeeDetailScreen (Payment history)
          │   ├─ EmployeeFormScreen
          │   └─ RecordPaymentScreen
          │
          ├─ JobsTab
          │   ├─ JobListScreen
          │   ├─ JobDetailScreen
          │   └─ JobFormScreen (Multi-step: details, employees, items)
          │
          ├─ InvoicesTab
          │   ├─ InvoiceListScreen (Filter by brand, status)
          │   ├─ InvoiceDetailScreen (View, generate PDF)
          │   └─ InvoiceFormScreen (Multi-step: customer, items, payment)
          │
          └─ SettingsTab
              ├─ SettingsScreen (Profile, logout)
              ├─ CompanyCredentialsScreen (Picbox/Echo config)
              └─ BackupRestoreScreen
```

### State Management (Zustand)
```typescript
// Example: Auth Store
interface AuthState {
  user: User | null;
  tokens: { accessToken: string; refreshToken: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Used in components:
const { user, login, logout } = useAuthStore();
```

**Stores:**
- **authStore:** User authentication state
- **productStore:** Product CRUD operations, search, filters
- **employeeStore:** Employee CRUD, payment history
- **jobStore:** Job CRUD, employee/item assignment
- **invoiceStore:** Invoice CRUD, PDF generation, brand filtering

---

## 🚀 Backend API Architecture (Node.js + Express)

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection (Mongoose)
│   │   ├── logger.js            # Winston logger (file + console)
│   │   └── swagger.js           # Swagger/OpenAPI config
│   │
│   ├── controllers/             # Business logic
│   │   ├── auth.controller.js   # Login, register, refresh token
│   │   ├── product.controller.js
│   │   ├── employee.controller.js # Payment recording
│   │   ├── job.controller.js    # Wage increment/decrement logic
│   │   ├── invoice.controller.js # PDF generation trigger
│   │   ├── dashboard.controller.js # Aggregations
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── upload.js            # Multer + Cloudinary config
│   │   └── validate.js          # express-validator schemas
│   │
│   ├── models/                  # Mongoose schemas (see DB section)
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Employee.js
│   │   └── ...
│   │
│   ├── routes/                  # Route definitions
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   └── ...
│   │
│   ├── utils/
│   │   └── pdfGenerator.js      # Puppeteer PDF generation
│   │
│   ├── scripts/
│   │   ├── seed.js              # Database seeding
│   │   └── seedCompanyCredentials.js # Company data seeding
│   │
│   └── index.js                 # Express app entry point
│
├── assets/
│   └── logos/                   # Company logos for PDFs
│       ├── picbox-logo.png
│       └── echo-logo.png
│
├── .env                         # Environment variables
├── Dockerfile                   # Docker containerization
└── package.json
```

### API Endpoints (REST)

#### Authentication
```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login (returns JWT tokens)
POST   /api/auth/refresh         Refresh access token
POST   /api/auth/logout          Logout (clear refresh token)
GET    /api/auth/me              Get current user profile
```

#### Products
```
POST   /api/products             Create product
GET    /api/products             List products (pagination, search)
GET    /api/products/:id         Get single product
PATCH  /api/products/:id         Update product
DELETE /api/products/:id         Delete product
```

#### Employees
```
POST   /api/employees            Create employee (auto-assign employeeId)
GET    /api/employees            List employees (pagination, search)
GET    /api/employees/:id        Get single employee
PATCH  /api/employees/:id        Update employee
DELETE /api/employees/:id        Delete employee
POST   /api/employees/:id/payments       Record payment
GET    /api/employees/:id/payments       Get payment history
```

#### Jobs
```
POST   /api/jobs                 Create job (increments wages)
GET    /api/jobs                 List jobs (filter by status, date)
GET    /api/jobs/:id             Get single job
PATCH  /api/jobs/:id             Update job (adjusts wages)
DELETE /api/jobs/:id             Delete job (reverses wages)
POST   /api/jobs/:id/expenses    Add expense to job
```

#### Invoices
```
POST   /api/invoices             Create invoice (auto-assign invoice_number)
GET    /api/invoices             List invoices (filter by brand, status)
GET    /api/invoices/:id         Get single invoice
PATCH  /api/invoices/:id         Update invoice
DELETE /api/invoices/:id         Delete invoice (removes PDF from Cloudinary)
GET    /api/invoices/:id/generate-pdf    Generate and download PDF
POST   /api/invoices/:id/upload  Upload PDF to Cloudinary (optional)
```

#### Dashboard
```
GET    /api/dashboard/summary    Get financial summary (revenue, expenses, profit)
```

#### Company Credentials
```
POST   /api/company-credentials  Create/Update company credentials
GET    /api/company-credentials  List credentials (Picbox, Echo)
GET    /api/company-credentials/:id  Get single credential
PATCH  /api/company-credentials/:id  Update credential
```

---

## 🔧 Critical Implementation Details

### 1. Auto-Increment Pattern (Counter Collection)
**Problem:** MongoDB doesn't have native auto-increment like SQL databases.  
**Solution:** Custom Counter collection with atomic operations.

```javascript
// backend/src/models/Counter.js
CounterSchema.statics.getNextSequence = async function(sequenceName) {
  const counter = await this.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

// Usage in Employee.controller.js
const employeeId = await Counter.getNextSequence('employeeId');

// Usage in Invoice model (pre-save hook)
if (this.isNew && !this.invoice_number) {
  const counter = await Counter.getNextSequence('invoice');
  this.invoice_number = counter;
}
```

### 2. Wage Calculation Integrity
**Challenge:** Keep employee pending wages in sync with job assignments/deletions.

**Implementation:**
```javascript
// Job Creation
for (const emp of assigned_employees) {
  employee.pendingSalary += emp.daily_wage;
}

// Job Deletion
for (const emp of job.assigned_employees) {
  if (emp.wage_status === 'pending') {
    // Prevent negative values (handles seeded data)
    const newPending = employee.pendingSalary - emp.daily_wage;
    employee.pendingSalary = Math.max(0, newPending);
  }
}

// Payment Recording
if (amount > employee.pendingSalary) {
  throw new Error('Payment exceeds pending salary');
}
employee.pendingSalary -= amount;
employee.totalSalaryReceived += amount;
```

**Data Integrity Safeguards:**
- Prevents negative pending salary
- Validates payment amount ≤ pending salary
- Atomic transactions (single save operation per employee)

### 3. PDF Generation on Render.com (Puppeteer)
**Challenge:** Render.com doesn't have Chrome pre-installed for Puppeteer.

**Solution:**
```javascript
// backend/src/index.js - Install Chrome at runtime
const installChromeOnRender = () => {
  if (process.env.RENDER || process.env.HOME === '/opt/render') {
    // Check if Chrome exists
    const chromePath = path.join(process.env.HOME, '.cache/puppeteer/...');
    if (!fs.existsSync(chromePath)) {
      execSync('npx puppeteer browsers install chrome', { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes
      });
    }
  }
};
installChromeOnRender(); // Runs before server starts

// backend/src/utils/pdfGenerator.js - Auto-detect Chrome path
const puppeteerConfig = {
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', ...]
};

if (process.env.RENDER) {
  // Use Puppeteer's automatic path detection
  puppeteerConfig.executablePath = require('puppeteer').executablePath();
}

const browser = await puppeteer.launch(puppeteerConfig);
```

**Key Settings:**
- **Timeout:** 120 seconds (handles Render cold starts)
- **Wait Strategy:** `domcontentloaded` (faster than `networkidle0`)
- **Chrome Args:** `--no-sandbox`, `--single-process` (required for containerized environments)
- **Post-Install Hook:** `package.json` → `"postinstall": "npx puppeteer browsers install chrome"`

### 4. UPI QR Code Generation
```javascript
// Generate UPI payment URI
const upiString = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&cu=INR`;

// Convert to QR code (base64 data URL)
const qrCodeDataURL = await QRCode.toDataURL(upiString, {
  width: 200,
  margin: 1
});

// Embed in HTML template
<img src="${qrCodeDataURL}" alt="UPI QR Code" class="qr-code">
```

**Libraries Used:**
- `qrcode` npm package (v1.5.4)
- Generates data URL (base64 PNG)
- Embedded directly in PDF HTML

### 5. File Storage Strategy
**Images (Product photos, Company logos):** Cloudinary CDN  
**PDFs (Invoice downloads):** Generated on-demand, sent directly to client (not stored permanently)

**Why not store PDFs in Cloudinary?**
- Invoices can be regenerated anytime from database data
- Reduces storage costs
- Always reflects latest company credentials/branding

**Implementation:**
```javascript
// Invoice PDF flow
1. User clicks "Generate PDF" → API call
2. Backend generates PDF in memory (Buffer)
3. PDF sent directly to client via HTTP response
4. Client saves to device local storage (expo-file-system)
5. User shares via WhatsApp/Email (expo-sharing)
```

---

## 📱 Mobile App Features

### Key Screens
1. **Dashboard**
   - Revenue, expenses, profit cards
   - Pending wages, pending invoices
   - Recent activity feed
   - Quick action buttons

2. **Product Management**
   - Add new/existing products (purchase cost tracking)
   - Search, filter, sort
   - View product usage history (jobs/invoices)

3. **Employee Management**
   - Add employees (auto-assigned ID)
   - Record payments (cash, UPI, bank transfer)
   - View payment history
   - Track pending/paid wages

4. **Job Management**
   - Create jobs with multi-step form:
     - Step 1: Job details (title, date, status)
     - Step 2: Assign employees with daily wage
     - Step 3: Select rented items (product + qty + rate)
     - Step 4: Add expenses (transport, food, misc)
   - Automatic wage calculation
   - Job status tracking (planned → in-progress → completed)

5. **Invoice Management**
   - Create invoices with multi-step form:
     - Step 1: Brand selection (Picbox/Echo)
     - Step 2: Customer details
     - Step 3: Add rented items
     - Step 4: Apply discount, record payment
   - Status: draft → estimate → final
   - Generate PDF with UPI QR code
   - Download and share via WhatsApp/Email

6. **Settings**
   - Company credentials management (Picbox/Echo)
   - Bank details, UPI details, tax details
   - Logo upload (Cloudinary)
   - Backup/restore database (planned feature)

---

## 🌐 Deployment Architecture

### Backend (Render.com)
```
GitHub Repository (main branch)
    ↓ (Git push triggers auto-deploy)
Render.com Build Process
    1. git clone repository
    2. npm install
    3. npx puppeteer browsers install chrome (postinstall)
    4. npm start (node src/index.js)
    ↓
Live Server
    URL: https://picbox-inventory-managment-app-react.onrender.com
    Port: 8080 (internal), 443 (external HTTPS)
    Environment: NODE_ENV=production
```

**Environment Variables (Render Dashboard):**
```env
PORT=8080
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
ENCRYPTION_KEY=<64-char-hex>
```

**Render Free Tier Limitations:**
- **Cold Start:** ~30-60 seconds after 15 minutes of inactivity
- **Memory:** 512MB RAM
- **CPU:** Shared
- **Build Time:** 15 minutes max
- **Monthly Hours:** 750 hours free (unlimited paid)

**Optimization for Free Tier:**
- Increased timeouts (120s) for Puppeteer
- Efficient MongoDB aggregations (indexed queries)
- Compression middleware (gzip)
- Minimal dependencies

### Frontend (Mobile App)

#### Development/Testing
```
Local Machine
    ↓
Expo CLI: npx expo start --tunnel
    ↓
Ngrok Tunnel (provided by Expo)
    ↓
Expo Go App (Android/iOS)
    - Scans QR code
    - Downloads bundle over tunnel
    - Runs app with live reload
```

#### Production APK Build (EAS Build - Cloud)
```
Local Machine
    1. Configure: eas.json, app.json
    2. Run: eas build --platform android --profile production
    ↓
Expo Cloud Servers
    1. Clone repository from Git
    2. Install dependencies
    3. Generate Android keystore (first time)
    4. Build APK with Gradle
    5. Upload APK to Expo servers
    ↓
Download Link
    - APK ready in 15-20 minutes
    - Download from expo.dev dashboard
    - Share APK file to users
```

**EAS Build Configuration (frontend/eas.json):**
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "distribution": "internal"
      }
    }
  }
}
```

**App Configuration (frontend/app.json):**
```json
{
  "expo": {
    "name": "PicBox Inventory",
    "version": "1.1.0",
    "android": {
      "package": "com.echosounds.picbox",
      "versionCode": 3
    }
  }
}
```

**Version Management:**
- `version`: User-facing version (e.g., "1.1.0")
- `versionCode`: Numeric build number (increments on each build)

---

## 🛠️ Development Workflow

### Local Development Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev           # Nodemon with hot reload

# Frontend
cd frontend
npm install
npx expo start --tunnel  # For testing on physical device
```

### Database Seeding
```bash
# Seed admin user + sample data
npm run seed

# Seed company credentials only (Picbox + Echo)
npm run seed:company
```

### Git Workflow
```
main branch (production)
  ↓ (create feature branch)
rahul-fix branch (development)
  ↓ (commit changes)
git add .
git commit -m "Feature: description"
  ↓ (merge to main)
git checkout main
git merge rahul-fix
git push origin main
  ↓ (Render auto-deploys)
```

---

## 🐛 Known Issues & Fixes

### Issue 1: Invoice PDF Generation Failing
**Root Cause:** Hardcoded Chrome version path on Render  
**Fix:** Use `puppeteer.executablePath()` for auto-detection  
**Files Modified:** `backend/src/utils/pdfGenerator.js`

### Issue 2: MongoDB Connection Timeout
**Root Cause:** Missing/incorrect `MONGO_URI` in .env  
**Fix:** Add correct connection string with credentials  
**Files Modified:** `backend/.env`

### Issue 3: Cold Start Timeouts on Render
**Root Cause:** Render free tier spins down after 15 minutes  
**Fix:** Increased all timeouts to 120 seconds  
**Files Modified:** `backend/src/utils/pdfGenerator.js`, `backend/src/index.js`

### Issue 4: Negative Pending Salary
**Root Cause:** Seeded data or job deletion edge cases  
**Fix:** Added `Math.max(0, newPendingSalary)` safeguard  
**Files Modified:** `backend/src/controllers/job.controller.js`

---

## 📊 Data Flow Examples

### Example 1: Create Job → Update Employee Wages
```javascript
// Request
POST /api/jobs
{
  "title": "Corporate Event",
  "date": "2024-03-20",
  "assigned_employees": [
    {
      "employee_id": "65f1234567890abcdef12345",
      "name": "John Doe",
      "role": "Technician",
      "daily_wage": 2000,
      "wage_status": "pending"
    }
  ],
  "rented_items": [
    {
      "product_id": "65f9876543210fedcba98765",
      "name": "JBL Speaker",
      "qty": 2,
      "rate": 3000
    }
  ],
  "expenses": [
    {
      "type": "transport",
      "amount": 500,
      "notes": "Fuel"
    }
  ],
  "status": "planned"
}

// Backend Processing (job.controller.js)
1. Create Job document
   - total_cost = 2000 (wage) + 6000 (2×3000 rental) + 500 (expense) = ₹8,500

2. Update Employee (John Doe)
   - Find employee by _id
   - pendingSalary += 2000
   - Save employee

// Database State After
Employee { pendingSalary: 2000, totalSalaryReceived: 0 }
Job { total_cost: 8500, status: 'planned' }

// Response
{
  "success": true,
  "message": "Job created successfully",
  "data": { ...job }
}
```

