# Backend Verification Checklist

Before deploying or integrating with frontend, verify all components:

## ✅ Installation & Setup
- [x] Node.js dependencies installed (`npm install`)
- [x] `.env` file created (copy from `.env.example`)
- [ ] MongoDB URI configured in `.env`
- [ ] JWT secrets generated and set
- [ ] Encryption key generated (64 hex chars)
- [ ] Cloudinary credentials added (optional for file uploads)

## ✅ Database
- [ ] MongoDB running (local or Atlas)
- [ ] Database seeded (`npm run seed`)
- [ ] Admin user created (admin@picbox.com)
- [ ] Sample data loaded

## ✅ Server Startup
- [ ] Development server starts (`npm run dev`)
- [ ] No errors in console
- [ ] Health check responds: http://localhost:8080/health
- [ ] Swagger docs load: http://localhost:8080/api-docs

## ✅ Authentication Tests
- [ ] Can register new user
- [ ] Can login with admin credentials
- [ ] Receives JWT access token
- [ ] Token works for protected routes
- [ ] 401 error for missing/invalid token

## ✅ Product Tests
- [ ] Can create new product
- [ ] Can list products with pagination
- [ ] Can search products
- [ ] Can update product
- [ ] Can delete product
- [ ] Purchase cost required for "new" products
- [ ] Purchase cost nullable for "existing" products

## ✅ Employee Tests
- [ ] Can create employee
- [ ] Employee gets auto-increment ID
- [ ] Can list employees
- [ ] pendingSalary starts at 0
- [ ] totalSalaryReceived starts at 0

## ✅ Job Tests (Critical!)
- [ ] Can create job with assigned employees
- [ ] Employee pendingSalary increases by daily_wage
- [ ] Can add rented items with job-level rates
- [ ] Can add expenses
- [ ] total_cost calculates correctly
- [ ] Can update job
- [ ] Can delete job
- [ ] Deleting job reverses pending wages

## ✅ Payment Tests (Critical!)
- [ ] Can record payment for employee
- [ ] Payment amount validated <= pendingSalary
- [ ] pendingSalary decreases by amount
- [ ] totalSalaryReceived increases by amount
- [ ] Payment history saved
- [ ] Cannot pay more than pending

## ✅ Invoice Tests
- [ ] Can create invoice
- [ ] Can attach company credentials
- [ ] Can upload PDF
- [ ] pending_amount calculates correctly
- [ ] Can filter by brand (Picbox/Echo)
- [ ] Can filter by status

## ✅ Credential Tests
- [ ] Admin can create credentials
- [ ] Non-admin cannot access credentials
- [ ] payload field is encrypted
- [ ] List view masks sensitive fields
- [ ] Detail view shows full decrypted data

## ✅ Dashboard Tests
- [ ] Summary endpoint returns all metrics
- [ ] totalWagesPending sums correctly
- [ ] totalWagesPaid sums correctly
- [ ] totalRevenue from invoices
- [ ] totalExpenses includes wages + expenses + costs
- [ ] profit = revenue - expenses
- [ ] Recent jobs displayed

## ✅ File Upload Tests
- [ ] Can upload image to Cloudinary
- [ ] Can upload PDF to Cloudinary
- [ ] Files deleted from Cloudinary when removed
- [ ] File size limits enforced

## ✅ Security Tests
- [ ] Passwords hashed (not plain text)
- [ ] JWT tokens expire correctly
- [ ] Admin routes require admin role
- [ ] Input validation catches bad data
- [ ] CORS configured properly

## ✅ API Documentation
- [ ] Swagger UI displays all endpoints
- [ ] Can test endpoints from Swagger
- [ ] Postman collection works
- [ ] All request/response examples correct

## ✅ Testing Suite
- [ ] `npm test` runs successfully
- [ ] All tests pass
- [ ] Wage increment test passes
- [ ] Payment validation test passes
- [ ] Job deletion test passes

## ✅ Production Readiness
- [ ] Environment variables documented
- [ ] Dockerfile builds successfully
- [ ] Health check endpoint works
- [ ] Logging configured
- [ ] Error handling comprehensive
- [ ] No console.logs in production code
- [ ] Database indexes created

## ✅ Deployment
- [ ] Code pushed to GitHub
- [ ] README.md is clear and complete
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] .env.example has all variables
- [ ] Production MongoDB created
- [ ] Deployed to Render/Docker/VPS
- [ ] Production URL accessible
- [ ] Production database seeded

---

## Quick Test Script

Run this to verify key functionality:

```bash
# 1. Start server
npm run dev

# 2. In another terminal, test endpoints:

# Health check
curl http://localhost:8080/health

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@picbox.com","password":"admin123"}'

# Copy the accessToken from response, then:

# Get dashboard (replace TOKEN)
curl http://localhost:8080/api/dashboard/summary \
  -H "Authorization: Bearer TOKEN"

# List employees
curl http://localhost:8080/api/employees \
  -H "Authorization: Bearer TOKEN"
```

---

## Common Issues & Fixes

### MongoDB Connection Failed
```bash
# Check MongoDB is running
brew services list | grep mongodb

# Or check connection string format
mongodb://localhost:27017/picbox  # Local
mongodb+srv://user:pass@cluster.net/picbox  # Atlas
```

### JWT Errors
```bash
# Regenerate secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Update JWT_SECRET in .env
```

### Encryption Key Error
```bash
# Generate valid key (64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Update ENCRYPTION_KEY in .env
```

### Port Already in Use
```bash
# Find process on port 8080
lsof -ti:8080

# Kill process
kill -9 $(lsof -ti:8080)

# Or change PORT in .env
```

---

## Performance Baseline

Expected response times (local):
- Health check: < 10ms
- Auth login: < 100ms
- Product list: < 50ms
- Job creation: < 200ms (includes wage updates)
- Dashboard summary: < 150ms (aggregations)

If slower, check:
- Database indexes created
- MongoDB connection pool size
- Network latency to MongoDB

---

## Ready for Frontend?

Once all items checked, the backend is ready for React Native integration!

Frontend will need:
1. Backend URL (local or production)
2. Admin credentials for testing
3. API endpoint documentation
4. JWT token handling strategy
5. Error response format understanding

All provided in DEPLOYMENT_GUIDE.md! 🚀
