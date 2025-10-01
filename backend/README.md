# PICBOX Backend API

Sound Rental Inventory Management System - Backend

## 🚀 Features

- **Authentication**: JWT-based auth with refresh tokens
- **Products**: Manage inventory (new/existing with purchase tracking)
- **Employees**: Track wages (pending/paid with auto-increment IDs)
- **Jobs**: Assign employees, rental items, expenses with automatic wage calculations
- **Invoices**: Generate invoices with company credentials
- **Credentials**: Secure storage with encryption for bank/tax/UPI details
- **Dashboard**: Real-time financial aggregations
- **File Uploads**: Cloudinary integration for images and PDFs

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

## 🛠️ Installation

1. Clone the repository:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```env
PORT=8080
NODE_ENV=development
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ENCRYPTION_KEY=64-char-hex-key
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Seed Database
```bash
npm run seed
```

This creates:
- Admin user (admin@picbox.com / admin123)
- 5 sample products
- 5 sample employees
- Sample jobs and invoices
- Company credentials

## 📚 API Documentation

Once running, visit:
- Swagger UI: http://localhost:8080/api-docs
- Health Check: http://localhost:8080/health

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

## 📦 API Endpoints

### Authentication
```
POST   /api/auth/register  - Register user
POST   /api/auth/login     - Login
POST   /api/auth/refresh   - Refresh token
POST   /api/auth/logout    - Logout
GET    /api/auth/me        - Get profile
```

### Products
```
POST   /api/products       - Create product
GET    /api/products       - List products
GET    /api/products/:id   - Get product
PATCH  /api/products/:id   - Update product
DELETE /api/products/:id   - Delete product
```

### Employees
```
POST   /api/employees              - Create employee
GET    /api/employees              - List employees
GET    /api/employees/:id          - Get employee
PATCH  /api/employees/:id          - Update employee
DELETE /api/employees/:id          - Delete employee
POST   /api/employees/:id/payments - Record payment
GET    /api/employees/:id/payments - Get payment history
```

### Jobs
```
POST   /api/jobs           - Create job (increments wages)
GET    /api/jobs           - List jobs
GET    /api/jobs/:id       - Get job
PATCH  /api/jobs/:id       - Update job
DELETE /api/jobs/:id       - Delete job (reverses wages)
POST   /api/jobs/:id/expenses - Add expense
```

### Invoices
```
POST   /api/invoices          - Create invoice
GET    /api/invoices          - List invoices
GET    /api/invoices/:id      - Get invoice
PATCH  /api/invoices/:id      - Update invoice
DELETE /api/invoices/:id      - Delete invoice
POST   /api/invoices/:id/upload - Upload PDF
```

### Credentials (Admin Only)
```
POST   /api/credentials    - Create credential
GET    /api/credentials    - List credentials
GET    /api/credentials/:id - Get credential
PATCH  /api/credentials/:id - Update credential
DELETE /api/credentials/:id - Delete credential
```

### Uploads
```
POST   /api/uploads/image  - Upload image
POST   /api/uploads/pdf    - Upload PDF
```

### Dashboard
```
GET    /api/dashboard/summary - Get financial summary
```

## 🔐 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Encrypted credential storage (AES-256-CBC)
- Rate limiting on auth endpoints
- Helmet security headers
- CORS configuration
- Input validation
- Audit logging

## 🐳 Docker Deployment

Build image:
```bash
docker build -t picbox-backend .
```

Run container:
```bash
docker run -p 8080:8080 --env-file .env picbox-backend
```

## ☁️ Render Deployment

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables
5. Deploy!

## 📊 Database Schema

See `src/models/` for detailed schemas:
- Users (authentication)
- Products (inventory)
- Employees (wage tracking)
- Jobs (events with wages)
- Invoices (billing)
- Credentials (encrypted)
- Payments (transaction history)
- Counters (auto-increment)

## 🔧 Key Business Logic

### Wage Management
- **Job Creation**: Automatically increments `employee.pendingSalary`
- **Payment Recording**: Decrements `pendingSalary`, increments `totalSalaryReceived`
- **Job Deletion**: Reverses pending wages
- **Job Update**: Adjusts wages if employees changed

### Financial Tracking
- **Revenue**: Sum of all invoice amounts
- **Expenses**: Wages paid + job expenses + new product costs
- **Profit**: Revenue - Expenses

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB URI format
mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Cloudinary Upload Errors
- Verify API credentials
- Check file size limits (5MB images, 10MB PDFs)

### JWT Token Errors
- Ensure JWT_SECRET is set
- Check token expiration settings

## 📄 License

MIT

## 👥 Support

For issues or questions, contact: support@picbox.com
